"use server";

import { revalidatePath } from "next/cache";

import { createSlug } from "@/lib/auth/slug";
import { expiredSessionMessage, getActionUser } from "@/lib/auth/session";
import type { Enums } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import {
  boardDeleteInputSchema,
  boardInputSchema,
  columnInputSchema,
  deleteInputSchema,
  formString,
  formStringArray,
  moveTaskInputSchema,
  projectInputSchema,
  taskInputSchema,
  updateTaskInputSchema,
  type WorkspaceActionState,
  workspaceSlugSchema,
} from "@/lib/workspace/validation";

const defaultColumns = ["Todo", "In progress", "Review", "Done"];

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ActionContext =
  | {
      error?: never;
      supabase: SupabaseServerClient;
      userId: string;
      workspace: {
        id: number;
        slug: string;
      };
    }
  | {
      error: string;
      supabase: SupabaseServerClient;
      userId?: never;
      workspace?: never;
    };

function actionMessage(message: string, fields?: Record<string, string>) {
  return {
    fields,
    message,
  } satisfies WorkspaceActionState;
}

function okMessage(message: string) {
  return {
    message,
    ok: true,
  } satisfies WorkspaceActionState;
}

function safeErrorMessage(fallback: string) {
  return fallback;
}

function fieldErrors(error: {
  flatten: () => { fieldErrors: WorkspaceActionState["errors"] };
}) {
  return error.flatten().fieldErrors;
}

async function requireActionContext(
  workspaceSlug: string,
): Promise<ActionContext> {
  const supabase = await createClient();
  const user = await getActionUser(supabase);

  if (!user) {
    return { error: expiredSessionMessage, supabase };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, slug")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return { error: "Workspace was not found or access was denied.", supabase };
  }

  return { supabase, userId: user.id, workspace };
}

function hasActionError(
  context: ActionContext,
): context is Extract<ActionContext, { error: string }> {
  return typeof context.error === "string";
}

async function nextSortOrder(
  table: "projects" | "boards" | "board_columns" | "tasks",
  filters: Record<string, number>,
) {
  const supabase = await createClient();
  let query = supabase
    .from(table)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { data } = await query.maybeSingle();

  return Number(data?.sort_order ?? 0) + 1000;
}

async function uniqueSlug(
  table: "projects" | "boards",
  workspaceId: number,
  name: string,
) {
  const supabase = await createClient();
  const baseSlug = createSlug(name);

  for (let index = 0; index < 20; index += 1) {
    const slug = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("slug", slug)
      .maybeSingle();

    if (!data) {
      return slug;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function createProject(
  _state: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const fields = {
    description: formString(formData, "description"),
    leadId: formString(formData, "leadId"),
    name: formString(formData, "name"),
    startDate: formString(formData, "startDate"),
    status: formString(formData, "status"),
    targetDate: formString(formData, "targetDate"),
    workspaceSlug: formString(formData, "workspaceSlug"),
  };
  const parsed = projectInputSchema.safeParse(fields);

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      fields,
      message: "Check the highlighted fields.",
    };
  }

  const context = await requireActionContext(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error, fields);
  }

  const { error } = await context.supabase.from("projects").insert({
    completed_at:
      parsed.data.status === "completed" ? new Date().toISOString() : null,
    created_by: context.userId,
    description: parsed.data.description || null,
    lead_id: parsed.data.leadId,
    name: parsed.data.name,
    slug: await uniqueSlug("projects", context.workspace.id, parsed.data.name),
    sort_order: await nextSortOrder("projects", {
      workspace_id: context.workspace.id,
    }),
    start_date: parsed.data.startDate,
    status: parsed.data.status,
    target_date: parsed.data.targetDate,
    workspace_id: context.workspace.id,
  });

  if (error) {
    return actionMessage(safeErrorMessage("Project could not be created."), fields);
  }

  revalidateWorkspace(parsed.data.workspaceSlug);

  return okMessage("Project created.");
}

export async function updateProject(
  _state: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const id = Number(formString(formData, "projectId"));
  const fields = {
    description: formString(formData, "description"),
    leadId: formString(formData, "leadId"),
    name: formString(formData, "name"),
    startDate: formString(formData, "startDate"),
    status: formString(formData, "status"),
    targetDate: formString(formData, "targetDate"),
    workspaceSlug: formString(formData, "workspaceSlug"),
  };
  const parsed = projectInputSchema.safeParse(fields);

  if (!Number.isInteger(id) || id <= 0 || !parsed.success) {
    return {
      errors: parsed.success ? undefined : fieldErrors(parsed.error),
      fields,
      message: "Check the highlighted fields.",
    };
  }

  const context = await requireActionContext(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error, fields);
  }

  const { error } = await context.supabase
    .from("projects")
    .update({
      completed_at:
        parsed.data.status === "completed" ? new Date().toISOString() : null,
      description: parsed.data.description || null,
      lead_id: parsed.data.leadId,
      name: parsed.data.name,
      start_date: parsed.data.startDate,
      status: parsed.data.status,
      target_date: parsed.data.targetDate,
    })
    .eq("id", id)
    .eq("workspace_id", context.workspace.id);

  if (error) {
    return actionMessage(safeErrorMessage("Project could not be updated."), fields);
  }

  revalidateWorkspace(parsed.data.workspaceSlug);

  return okMessage("Project updated.");
}

export async function deleteProject(
  input: unknown,
): Promise<WorkspaceActionState> {
  const parsed = deleteInputSchema.safeParse(input);

  if (!parsed.success) {
    return actionMessage("Project could not be deleted.");
  }

  const context = await requireActionContext(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error);
  }

  const { error } = await context.supabase
    .from("projects")
    .delete()
    .eq("workspace_id", context.workspace.id)
    .eq("id", parsed.data.id);

  if (error) {
    return actionMessage(safeErrorMessage("Project could not be deleted."));
  }

  revalidateWorkspace(parsed.data.workspaceSlug);

  return okMessage("Project deleted.");
}

export async function createBoard(
  _state: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const fields = {
    description: formString(formData, "description"),
    name: formString(formData, "name"),
    projectId: formString(formData, "projectId"),
    workspaceSlug: formString(formData, "workspaceSlug"),
  };
  const parsed = boardInputSchema.safeParse(fields);

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      fields,
      message: "Check the highlighted fields.",
    };
  }

  const context = await requireActionContext(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error, fields);
  }

  const { data: project } = await context.supabase
    .from("projects")
    .select("id")
    .eq("workspace_id", context.workspace.id)
    .eq("id", parsed.data.projectId)
    .maybeSingle();

  if (!project) {
    return actionMessage("Choose a project inside this workspace.", fields);
  }

  const { data: board, error } = await context.supabase
    .from("boards")
    .insert({
      created_by: context.userId,
      description: parsed.data.description || null,
      name: parsed.data.name,
      project_id: parsed.data.projectId,
      slug: await uniqueSlug("boards", context.workspace.id, parsed.data.name),
      sort_order: await nextSortOrder("boards", {
        workspace_id: context.workspace.id,
      }),
      workspace_id: context.workspace.id,
    })
    .select("id")
    .single();

  if (error || !board) {
    return actionMessage("Board could not be created.", fields);
  }

  const { error: columnsError } = await context.supabase
    .from("board_columns")
    .insert(
      defaultColumns.map((name, index) => ({
        board_id: board.id,
        name,
        sort_order: (index + 1) * 1000,
        workspace_id: context.workspace.id,
      })),
    );

  if (columnsError) {
    return actionMessage("Default board columns could not be created.", fields);
  }

  revalidateWorkspace(parsed.data.workspaceSlug);

  return okMessage("Board created.");
}

export async function updateBoard(
  _state: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const id = Number(formString(formData, "boardId"));
  const fields = {
    description: formString(formData, "description"),
    name: formString(formData, "name"),
    projectId: formString(formData, "projectId"),
    workspaceSlug: formString(formData, "workspaceSlug"),
  };
  const parsed = boardInputSchema.safeParse(fields);

  if (!Number.isInteger(id) || id <= 0 || !parsed.success) {
    return {
      errors: parsed.success ? undefined : fieldErrors(parsed.error),
      fields,
      message: "Check the highlighted fields.",
    };
  }

  const context = await requireActionContext(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error, fields);
  }

  const { data: project } = await context.supabase
    .from("projects")
    .select("id")
    .eq("workspace_id", context.workspace.id)
    .eq("id", parsed.data.projectId)
    .maybeSingle();

  if (!project) {
    return actionMessage("Choose a project inside this workspace.", fields);
  }

  const { error } = await context.supabase
    .from("boards")
    .update({
      description: parsed.data.description || null,
      name: parsed.data.name,
      project_id: parsed.data.projectId,
    })
    .eq("id", id)
    .eq("workspace_id", context.workspace.id);

  if (error) {
    return actionMessage("Board could not be updated.", fields);
  }

  revalidateWorkspace(parsed.data.workspaceSlug);

  return okMessage("Board updated.");
}

export async function deleteBoard(
  input: unknown,
): Promise<WorkspaceActionState> {
  const parsed = deleteInputSchema.safeParse(input);

  if (!parsed.success) {
    return actionMessage("Board could not be deleted.");
  }

  const context = await requireActionContext(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error);
  }

  const { error } = await context.supabase
    .from("boards")
    .delete()
    .eq("workspace_id", context.workspace.id)
    .eq("id", parsed.data.id);

  if (error) {
    return actionMessage("Board could not be deleted.");
  }

  revalidateWorkspace(parsed.data.workspaceSlug);

  return okMessage("Board deleted.");
}

export async function createColumn(
  _state: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const fields = {
    boardSlug: formString(formData, "boardSlug"),
    name: formString(formData, "name"),
    workspaceSlug: formString(formData, "workspaceSlug"),
  };
  const parsed = columnInputSchema.safeParse(fields);

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      fields,
      message: "Check the highlighted fields.",
    };
  }

  const context = await requireActionContext(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error, fields);
  }

  const board = await getScopedBoard(
    context.supabase,
    context.workspace.id,
    parsed.data.boardSlug,
  );

  if (!board) {
    return actionMessage("Board was not found.", fields);
  }

  const { error } = await context.supabase.from("board_columns").insert({
    board_id: board.id,
    name: parsed.data.name,
    sort_order: await nextSortOrder("board_columns", { board_id: board.id }),
    workspace_id: context.workspace.id,
  });

  if (error) {
    return actionMessage("Column could not be created.", fields);
  }

  revalidateBoard(parsed.data.workspaceSlug, parsed.data.boardSlug);

  return okMessage("Column created.");
}

export async function deleteColumn(
  input: unknown,
): Promise<WorkspaceActionState> {
  const parsed = boardDeleteInputSchema.safeParse(input);

  if (!parsed.success) {
    return actionMessage("Column could not be deleted.");
  }

  const context = await requireActionContext(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error);
  }

  const { error } = await context.supabase
    .from("board_columns")
    .delete()
    .eq("workspace_id", context.workspace.id)
    .eq("id", parsed.data.id);

  if (error) {
    return actionMessage("Move tasks out of this column before deleting it.");
  }

  revalidateBoard(parsed.data.workspaceSlug, parsed.data.boardSlug);

  return okMessage("Column deleted.");
}

export async function createTask(
  _state: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = taskInputSchema.safeParse({
    assigneeIds: formStringArray(formData, "assigneeIds"),
    boardSlug: formString(formData, "boardSlug"),
    columnId: formString(formData, "columnId"),
    description: formString(formData, "description"),
    dueDate: formString(formData, "dueDate"),
    labelIds: formStringArray(formData, "labelIds"),
    priority: formString(formData, "priority"),
    title: formString(formData, "title"),
    workspaceSlug: formString(formData, "workspaceSlug"),
  });

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      message: "Check the highlighted fields.",
    };
  }

  return saveTask(parsed.data);
}

export async function updateTask(
  _state: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = updateTaskInputSchema.safeParse({
    assigneeIds: formStringArray(formData, "assigneeIds"),
    boardSlug: formString(formData, "boardSlug"),
    columnId: formString(formData, "columnId"),
    description: formString(formData, "description"),
    dueDate: formString(formData, "dueDate"),
    labelIds: formStringArray(formData, "labelIds"),
    priority: formString(formData, "priority"),
    taskId: formString(formData, "taskId"),
    title: formString(formData, "title"),
    workspaceSlug: formString(formData, "workspaceSlug"),
  });

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      message: "Check the highlighted fields.",
    };
  }

  return saveTask(parsed.data);
}

export async function deleteTask(
  input: unknown,
): Promise<WorkspaceActionState> {
  const parsed = boardDeleteInputSchema.safeParse(input);

  if (!parsed.success) {
    return actionMessage("Task could not be deleted.");
  }

  const context = await requireActionContext(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error);
  }

  const { error } = await context.supabase
    .from("tasks")
    .delete()
    .eq("workspace_id", context.workspace.id)
    .eq("id", parsed.data.id);

  if (error) {
    return actionMessage("Task could not be deleted.");
  }

  revalidateBoard(parsed.data.workspaceSlug, parsed.data.boardSlug);

  return okMessage("Task deleted.");
}

export async function createLabel(
  _state: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const workspaceSlug = formString(formData, "workspaceSlug").trim();
  const boardSlug = formString(formData, "boardSlug").trim();
  const name = formString(formData, "name").trim();
  const color = formString(formData, "color").trim();
  const parsedWorkspace = workspaceSlugSchema.safeParse(workspaceSlug);

  if (
    !parsedWorkspace.success ||
    name.length < 1 ||
    name.length > 40 ||
    !/^#[0-9a-fA-F]{6}$/.test(color)
  ) {
    return actionMessage("Add a label name and valid color.");
  }

  const context = await requireActionContext(workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error);
  }

  const { error } = await context.supabase.from("labels").insert({
    color,
    name,
    workspace_id: context.workspace.id,
  });

  if (error) {
    if (error.code === "23505") {
      return actionMessage("A label with this name already exists.");
    }

    return actionMessage("Label could not be created.");
  }

  revalidateBoard(workspaceSlug, boardSlug);

  return okMessage("Label created.");
}

export async function moveTask(input: unknown): Promise<WorkspaceActionState> {
  const parsed = moveTaskInputSchema.safeParse(input);

  if (!parsed.success) {
    return actionMessage("Task move was invalid.");
  }

  const context = await requireActionContext(parsed.data.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error);
  }

  const board = await getScopedBoard(
    context.supabase,
    context.workspace.id,
    parsed.data.boardSlug,
  );

  if (!board) {
    return actionMessage("Board was not found.");
  }

  const { data: task } = await context.supabase
    .from("tasks")
    .select("id")
    .eq("workspace_id", context.workspace.id)
    .eq("board_id", board.id)
    .eq("id", parsed.data.taskId)
    .maybeSingle();

  if (!task) {
    return actionMessage("Task was not found.");
  }

  const { error } = await context.supabase.rpc("move_task", {
    p_new_sort_order: parsed.data.newSortOrder,
    p_target_column_id: parsed.data.targetColumnId,
    p_task_id: parsed.data.taskId,
  });

  if (error) {
    return actionMessage("Task move could not be saved.");
  }

  revalidateBoard(parsed.data.workspaceSlug, parsed.data.boardSlug);

  return okMessage("Task moved.");
}

async function saveTask(
  input:
    | ReturnType<typeof taskInputSchema.parse>
    | ReturnType<typeof updateTaskInputSchema.parse>,
) {
  const context = await requireActionContext(input.workspaceSlug);

  if (hasActionError(context)) {
    return actionMessage(context.error);
  }

  const board = await getScopedBoard(
    context.supabase,
    context.workspace.id,
    input.boardSlug,
  );

  if (!board) {
    return actionMessage("Board was not found.");
  }

  const { data: column } = await context.supabase
    .from("board_columns")
    .select("id")
    .eq("workspace_id", context.workspace.id)
    .eq("board_id", board.id)
    .eq("id", input.columnId)
    .maybeSingle();

  if (!column) {
    return actionMessage("Choose a column on this board.");
  }

  if (
    input.assigneeIds.length > 0 &&
    !(await areWorkspaceMembers(
      context.supabase,
      context.workspace.id,
      input.assigneeIds,
    ))
  ) {
    return actionMessage("Choose assignees in this workspace.");
  }

  if (
    input.labelIds.length > 0 &&
    !(await areWorkspaceLabels(
      context.supabase,
      context.workspace.id,
      input.labelIds,
    ))
  ) {
    return actionMessage("Choose labels in this workspace.");
  }

  const taskPayload = {
    column_id: input.columnId,
    description: input.description || null,
    due_date: input.dueDate,
    priority: input.priority as Enums<"task_priority">,
    title: input.title,
  };

  const existingTaskId = "taskId" in input ? input.taskId : null;
  const taskResult = existingTaskId
    ? await context.supabase
        .from("tasks")
        .update(taskPayload)
        .eq("workspace_id", context.workspace.id)
        .eq("board_id", board.id)
        .eq("id", existingTaskId)
        .select("id")
        .single()
    : await context.supabase
        .from("tasks")
        .insert({
          ...taskPayload,
          board_id: board.id,
          created_by: context.userId,
          project_id: board.project_id,
          sort_order: await nextSortOrder("tasks", { column_id: input.columnId }),
          workspace_id: context.workspace.id,
        })
        .select("id")
        .single();

  if (taskResult.error || !taskResult.data) {
    return actionMessage("Task could not be saved.");
  }

  const taskId = taskResult.data.id;
  await context.supabase.from("task_assignees").delete().eq("task_id", taskId);
  await context.supabase.from("task_labels").delete().eq("task_id", taskId);

  if (input.assigneeIds.length > 0) {
    const { error } = await context.supabase.from("task_assignees").insert(
      input.assigneeIds.map((profileId) => ({
        assigned_by: context.userId,
        profile_id: profileId,
        task_id: taskId,
      })),
    );

    if (error) {
      return actionMessage("Task assignees could not be saved.");
    }
  }

  if (input.labelIds.length > 0) {
    const { error } = await context.supabase.from("task_labels").insert(
      input.labelIds.map((labelId) => ({
        label_id: labelId,
        task_id: taskId,
      })),
    );

    if (error) {
      return actionMessage("Task labels could not be saved.");
    }
  }

  revalidateBoard(input.workspaceSlug, input.boardSlug);

  return okMessage(existingTaskId ? "Task updated." : "Task created.");
}

async function getScopedBoard(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: number,
  boardSlug: string,
) {
  const { data } = await supabase
    .from("boards")
    .select("id, project_id")
    .eq("workspace_id", workspaceId)
    .eq("slug", boardSlug)
    .maybeSingle();

  return data;
}

async function areWorkspaceMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: number,
  memberIds: string[],
) {
  const uniqueIds = [...new Set(memberIds)];
  const { count, error } = await supabase
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .in("user_id", uniqueIds);

  return !error && count === uniqueIds.length;
}

async function areWorkspaceLabels(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: number,
  labelIds: number[],
) {
  const uniqueIds = [...new Set(labelIds)];
  const { count, error } = await supabase
    .from("labels")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .in("id", uniqueIds);

  return !error && count === uniqueIds.length;
}

function revalidateWorkspace(workspaceSlug: string) {
  revalidatePath(`/${workspaceSlug}`);
  revalidatePath(`/${workspaceSlug}/projects`);
  revalidatePath(`/${workspaceSlug}/boards`);
}

function revalidateBoard(workspaceSlug: string, boardSlug: string) {
  revalidateWorkspace(workspaceSlug);
  revalidatePath(`/${workspaceSlug}/boards/${boardSlug}`);
}
