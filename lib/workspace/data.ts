import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";

import type { Enums, Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceMemberOption = {
  avatarUrl: string | null;
  fullName: string;
  id: string;
  initials: string;
  role: Enums<"app_role">;
};

export type LabelOption = Pick<Tables<"labels">, "color" | "id" | "name">;

export type ProjectListItem = Pick<
  Tables<"projects">,
  | "description"
  | "id"
  | "lead_id"
  | "name"
  | "slug"
  | "start_date"
  | "status"
  | "target_date"
> & {
  boardCount: number;
  lead: WorkspaceMemberOption | null;
  taskCount: number;
};

export type BoardListItem = Pick<
  Tables<"boards">,
  "description" | "id" | "name" | "project_id" | "slug"
> & {
  columnCount: number;
  projectName: string;
  projectSlug: string;
  taskCount: number;
};

export type BoardTask = Pick<
  Tables<"tasks">,
  | "column_id"
  | "description"
  | "due_date"
  | "id"
  | "priority"
  | "sort_order"
  | "title"
> & {
  assignees: WorkspaceMemberOption[];
  labels: LabelOption[];
};

export type BoardColumn = Pick<
  Tables<"board_columns">,
  "id" | "name" | "sort_order"
> & {
  tasks: BoardTask[];
};

export type BoardDetail = Pick<
  Tables<"boards">,
  "description" | "id" | "name" | "project_id" | "slug"
> & {
  columns: BoardColumn[];
  labels: LabelOption[];
  members: WorkspaceMemberOption[];
  projectName: string;
  projectSlug: string;
  workspaceId: number;
};

export type ProjectDetail = ProjectListItem & {
  boards: BoardListItem[];
  members: WorkspaceMemberOption[];
};

export type WorkspaceOverviewTask = Pick<
  Tables<"tasks">,
  "due_date" | "id" | "priority" | "title"
> & {
  boardName: string;
  boardSlug: string;
  columnName: string;
  projectName: string;
};

export type WorkspaceOverviewData = {
  activeColumnCount: number;
  boardCount: number;
  dueSoonCount: number;
  focusTasks: WorkspaceOverviewTask[];
  inProgressCount: number;
  memberCount: number;
  openTaskCount: number;
  projectCount: number;
  workspace: WorkspaceRow;
};

type WorkspaceRow = Pick<Tables<"workspaces">, "id" | "name" | "slug">;

type WorkspaceMemberRow = {
  role: Enums<"app_role">;
  user_id: string;
  profiles: Pick<Tables<"profiles">, "avatar_url" | "full_name"> | null;
};

type TaskAssigneeRow = {
  profile_id: string;
  task_id: number;
};

type TaskLabelRow = {
  label_id: number;
  task_id: number;
};

type OverviewTaskRow = Pick<
  Tables<"tasks">,
  "board_id" | "column_id" | "due_date" | "id" | "priority" | "project_id" | "sort_order" | "title"
>;

export const getWorkspaceBySlug = cache(
  async (workspaceSlug: string): Promise<WorkspaceRow> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, slug")
      .eq("slug", workspaceSlug)
      .maybeSingle();

    if (error || !data) {
      notFound();
    }

    return data;
  },
);

export const getWorkspaceMembers = cache(async (workspaceId: number) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("user_id, role, profiles!workspace_members_user_id_fkey(full_name, avatar_url)")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .returns<WorkspaceMemberRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map((member) => {
    const fullName = member.profiles?.full_name || "Team member";

    return {
      avatarUrl: member.profiles?.avatar_url ?? null,
      fullName,
      id: member.user_id,
      initials: getInitials(fullName),
      role: member.role,
    };
  });
});

export const getWorkspaceLabels = cache(async (workspaceId: number) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("labels")
    .select("id, name, color")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
});

export const getProjectsPageData = cache(async (workspaceSlug: string) => {
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  const supabase = await createClient();

  const [projectsResult, boardsResult, tasksResult, members] =
    await Promise.all([
      supabase
        .from("projects")
        .select(
          "id, name, slug, description, status, lead_id, start_date, target_date",
        )
        .eq("workspace_id", workspace.id)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("boards")
        .select("id, project_id")
        .eq("workspace_id", workspace.id),
      supabase
        .from("tasks")
        .select("id, project_id")
        .eq("workspace_id", workspace.id),
      getWorkspaceMembers(workspace.id),
    ]);

  if (projectsResult.error || !projectsResult.data) {
    notFound();
  }

  const boardCounts = countBy(boardsResult.data ?? [], "project_id");
  const taskCounts = countBy(tasksResult.data ?? [], "project_id");
  const memberMap = new Map(members.map((member) => [member.id, member]));

  return {
    members,
    projects: projectsResult.data.map((project) => ({
      ...project,
      boardCount: boardCounts.get(project.id) ?? 0,
      lead: project.lead_id ? memberMap.get(project.lead_id) ?? null : null,
      taskCount: taskCounts.get(project.id) ?? 0,
    })),
    workspace,
  };
});

export const getBoardsPageData = cache(async (workspaceSlug: string) => {
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  const supabase = await createClient();

  const [projectsResult, boardsResult, columnsResult, tasksResult] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, slug")
        .eq("workspace_id", workspace.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("boards")
        .select("id, name, slug, description, project_id")
        .eq("workspace_id", workspace.id)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("board_columns")
        .select("id, board_id")
        .eq("workspace_id", workspace.id),
      supabase.from("tasks").select("id, board_id").eq("workspace_id", workspace.id),
    ]);

  if (projectsResult.error || boardsResult.error || !projectsResult.data || !boardsResult.data) {
    notFound();
  }

  const projectMap = new Map(projectsResult.data.map((project) => [project.id, project]));
  const columnCounts = countBy(columnsResult.data ?? [], "board_id");
  const taskCounts = countBy(tasksResult.data ?? [], "board_id");

  return {
    boards: boardsResult.data.flatMap((board) => {
      const project = projectMap.get(board.project_id);

      if (!project) {
        return [];
      }

      return {
        ...board,
        columnCount: columnCounts.get(board.id) ?? 0,
        projectName: project.name,
        projectSlug: project.slug,
        taskCount: taskCounts.get(board.id) ?? 0,
      };
    }),
    projects: projectsResult.data,
    workspace,
  };
});

export const getWorkspaceQuickTaskTarget = cache(async (workspaceSlug: string) => {
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  const supabase = await createClient();
  const { data } = await supabase
    .from("boards")
    .select("slug")
    .eq("workspace_id", workspace.id)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.slug ?? null;
});

export const getWorkspaceOverviewData = cache(
  async (workspaceSlug: string): Promise<WorkspaceOverviewData> => {
    const workspace = await getWorkspaceBySlug(workspaceSlug);
    const supabase = await createClient();
    const today = new Date();
    const dueSoon = new Date(today);
    dueSoon.setDate(today.getDate() + 7);

    const [
      projectsResult,
      boardsResult,
      columnsResult,
      tasksResult,
      members,
    ] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name")
        .eq("workspace_id", workspace.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("boards")
        .select("id, name, slug, project_id")
        .eq("workspace_id", workspace.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("board_columns")
        .select("id, name")
        .eq("workspace_id", workspace.id),
      supabase
        .from("tasks")
        .select("id, title, priority, due_date, sort_order, project_id, board_id, column_id")
        .eq("workspace_id", workspace.id)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true })
        .returns<OverviewTaskRow[]>(),
      getWorkspaceMembers(workspace.id),
    ]);

    if (
      projectsResult.error ||
      boardsResult.error ||
      columnsResult.error ||
      tasksResult.error ||
      !projectsResult.data ||
      !boardsResult.data ||
      !columnsResult.data ||
      !tasksResult.data
    ) {
      notFound();
    }

    const projectMap = new Map(
      projectsResult.data.map((project) => [project.id, project.name]),
    );
    const boardMap = new Map(
      boardsResult.data.map((board) => [
        board.id,
        {
          name: board.name,
          slug: board.slug,
        },
      ]),
    );
    const columnMap = new Map(
      columnsResult.data.map((column) => [column.id, column.name]),
    );
    const activeColumns = new Set(tasksResult.data.map((task) => task.column_id));
    const inProgressCount = tasksResult.data.filter((task) => {
      const columnName = columnMap.get(task.column_id)?.toLowerCase() ?? "";

      return columnName.includes("progress") || columnName.includes("doing");
    }).length;
    const dueSoonCount = tasksResult.data.filter((task) => {
      if (!task.due_date) {
        return false;
      }

      const dueDate = new Date(`${task.due_date}T00:00:00`);

      return dueDate >= startOfDay(today) && dueDate <= startOfDay(dueSoon);
    }).length;
    const priorityRank: Record<Enums<"task_priority">, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
      none: 4,
    };

    const focusTasks = [...tasksResult.data]
      .sort((first, second) => {
        const rankDelta =
          priorityRank[first.priority] - priorityRank[second.priority];

        if (rankDelta !== 0) {
          return rankDelta;
        }

        return Number(first.sort_order) - Number(second.sort_order);
      })
      .slice(0, 8)
      .flatMap((task) => {
        const board = boardMap.get(task.board_id);
        const projectName = projectMap.get(task.project_id);
        const columnName = columnMap.get(task.column_id);

        if (!board || !projectName || !columnName) {
          return [];
        }

        return {
          boardName: board.name,
          boardSlug: board.slug,
          columnName,
          due_date: task.due_date,
          id: task.id,
          priority: task.priority,
          projectName,
          title: task.title,
        };
      });

    return {
      activeColumnCount: activeColumns.size,
      boardCount: boardsResult.data.length,
      dueSoonCount,
      focusTasks,
      inProgressCount,
      memberCount: members.length,
      openTaskCount: tasksResult.data.length,
      projectCount: projectsResult.data.length,
      workspace,
    };
  },
);

export const getProjectDetailData = cache(
  async (workspaceSlug: string, projectSlug: string): Promise<ProjectDetail> => {
    const [{ projects, members }, { boards }] = await Promise.all([
      getProjectsPageData(workspaceSlug),
      getBoardsPageData(workspaceSlug),
    ]);
    const project = projects.find((item) => item.slug === projectSlug);

    if (!project) {
      notFound();
    }

    return {
      ...project,
      boards: boards.filter((board) => board.project_id === project.id),
      members,
    };
  },
);

export const getBoardDetailData = cache(
  async (workspaceSlug: string, boardSlug: string): Promise<BoardDetail> => {
    const workspace = await getWorkspaceBySlug(workspaceSlug);
    const supabase = await createClient();

    const { data: board, error: boardError } = await supabase
      .from("boards")
      .select("id, name, slug, description, project_id")
      .eq("workspace_id", workspace.id)
      .eq("slug", boardSlug)
      .maybeSingle();

    if (boardError || !board) {
      notFound();
    }

    const [projectResult, columnsResult, tasksResult, labels, members] =
      await Promise.all([
        supabase
          .from("projects")
          .select("name, slug")
          .eq("id", board.project_id)
          .eq("workspace_id", workspace.id)
          .maybeSingle(),
        supabase
          .from("board_columns")
          .select("id, name, sort_order")
          .eq("workspace_id", workspace.id)
          .eq("board_id", board.id)
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true }),
        supabase
          .from("tasks")
          .select(
            "id, column_id, title, description, priority, due_date, sort_order",
          )
          .eq("workspace_id", workspace.id)
          .eq("board_id", board.id)
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true }),
        getWorkspaceLabels(workspace.id),
        getWorkspaceMembers(workspace.id),
      ]);

    const taskIds = tasksResult.data?.map((task) => task.id) ?? [];
    const [assigneesResult, taskLabelsResult] =
      taskIds.length > 0
        ? await Promise.all([
            supabase
              .from("task_assignees")
              .select("task_id, profile_id")
              .in("task_id", taskIds),
            supabase
              .from("task_labels")
              .select("task_id, label_id")
              .in("task_id", taskIds),
          ])
        : [
            { data: [], error: null },
            { data: [], error: null },
          ];

    if (
      projectResult.error ||
      columnsResult.error ||
      tasksResult.error ||
      assigneesResult.error ||
      taskLabelsResult.error ||
      !projectResult.data ||
      !columnsResult.data ||
      !tasksResult.data
    ) {
      notFound();
    }

    const memberMap = new Map(members.map((member) => [member.id, member]));
    const labelMap = new Map(labels.map((label) => [label.id, label]));
    const assigneesByTask = groupTaskAssignees(
      assigneesResult.data ?? [],
      memberMap,
    );
    const labelsByTask = groupTaskLabels(taskLabelsResult.data ?? [], labelMap);
    const tasksByColumn = new Map<number, BoardTask[]>();

    for (const task of tasksResult.data) {
      const tasks = tasksByColumn.get(task.column_id) ?? [];
      tasks.push({
        ...task,
        assignees: assigneesByTask.get(task.id) ?? [],
        labels: labelsByTask.get(task.id) ?? [],
      });
      tasksByColumn.set(task.column_id, tasks);
    }

    return {
      ...board,
      columns: columnsResult.data.map((column) => ({
        ...column,
        tasks: tasksByColumn.get(column.id) ?? [],
      })),
      labels,
      members,
      projectName: projectResult.data.name,
      projectSlug: projectResult.data.slug,
      workspaceId: workspace.id,
    };
  },
);

function countBy<T extends Record<K, number>, K extends keyof T>(
  rows: T[],
  key: K,
) {
  const counts = new Map<number, number>();

  for (const row of rows) {
    counts.set(row[key], (counts.get(row[key]) ?? 0) + 1);
  }

  return counts;
}

function groupTaskAssignees(
  rows: TaskAssigneeRow[],
  memberMap: Map<string, WorkspaceMemberOption>,
) {
  const grouped = new Map<number, WorkspaceMemberOption[]>();

  for (const row of rows) {
    const member = memberMap.get(row.profile_id);

    if (!member) {
      continue;
    }

    const assignees = grouped.get(row.task_id) ?? [];
    assignees.push(member);
    grouped.set(row.task_id, assignees);
  }

  return grouped;
}

function groupTaskLabels(
  rows: TaskLabelRow[],
  labelMap: Map<number, LabelOption>,
) {
  const grouped = new Map<number, LabelOption[]>();

  for (const row of rows) {
    const label = labelMap.get(row.label_id);

    if (!label) {
      continue;
    }

    const labels = grouped.get(row.task_id) ?? [];
    labels.push(label);
    grouped.set(row.task_id, labels);
  }

  return grouped;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "T";
  const second = parts[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase();
}
