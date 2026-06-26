"use server";

import { z } from "zod";

import { getInitials } from "@/lib/auth/data";
import { getActionUser } from "@/lib/auth/session";
import type { Enums, Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

const searchInputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .transform((value) => value.replace(/\s+/g, " ")),
  workspaceSlug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export type WorkspaceSearchResult = {
  context: string;
  href: string;
  id: string;
  initials?: string;
  meta?: string;
  title: string;
  type: "board" | "member" | "project" | "task";
};

export type WorkspaceSearchResponse = {
  message?: string;
  results: WorkspaceSearchResult[];
};

type TaskSearchRow = Pick<
  Tables<"tasks">,
  "due_date" | "id" | "priority" | "title"
> & {
  board_columns: Pick<Tables<"board_columns">, "name"> | null;
  boards: Pick<Tables<"boards">, "name" | "slug"> | null;
  projects: Pick<Tables<"projects">, "name" | "slug"> | null;
};

type BoardSearchRow = Pick<Tables<"boards">, "id" | "name" | "slug"> & {
  projects: Pick<Tables<"projects">, "name" | "slug"> | null;
};

type MemberSearchRow = {
  profiles: Pick<Tables<"profiles">, "full_name"> | null;
  role: Enums<"app_role">;
  user_id: string;
};

const priorityLabels: Record<Enums<"task_priority">, string> = {
  high: "High",
  low: "Low",
  medium: "Medium",
  none: "No priority",
  urgent: "Urgent",
};

export async function searchWorkspace(input: {
  query: string;
  workspaceSlug: string;
}): Promise<WorkspaceSearchResponse> {
  const parsed = searchInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      results: [],
    };
  }

  const supabase = await createClient();
  const user = await getActionUser(supabase);

  if (!user) {
    return {
      message: "Session expired. Sign in again.",
      results: [],
    };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, slug")
    .eq("slug", parsed.data.workspaceSlug)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return {
      results: [],
    };
  }

  const pattern = toIlikePattern(parsed.data.query);

  if (!pattern) {
    return {
      results: [],
    };
  }

  const [tasksResult, boardsResult, projectsResult, membersResult] =
    await Promise.all([
      supabase
        .from("tasks")
        .select(
          "id, title, priority, due_date, boards!tasks_board_id_fkey(name, slug), projects!tasks_project_id_fkey(name, slug), board_columns!tasks_column_id_fkey(name)",
        )
        .eq("workspace_id", workspace.id)
        .ilike("title", pattern)
        .order("updated_at", { ascending: false })
        .limit(6)
        .returns<TaskSearchRow[]>(),
      supabase
        .from("boards")
        .select("id, name, slug, projects!boards_project_id_fkey(name, slug)")
        .eq("workspace_id", workspace.id)
        .ilike("name", pattern)
        .order("updated_at", { ascending: false })
        .limit(4)
        .returns<BoardSearchRow[]>(),
      supabase
        .from("projects")
        .select("id, name, slug")
        .eq("workspace_id", workspace.id)
        .ilike("name", pattern)
        .order("updated_at", { ascending: false })
        .limit(4),
      supabase
        .from("workspace_members")
        .select(
          "user_id, role, profiles!workspace_members_user_id_fkey(full_name)",
        )
        .eq("workspace_id", workspace.id)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(100)
        .returns<MemberSearchRow[]>(),
    ]);

  if (
    tasksResult.error ||
    boardsResult.error ||
    projectsResult.error ||
    membersResult.error
  ) {
    return {
      message: "Search could not be completed.",
      results: [],
    };
  }

  const query = parsed.data.query.toLowerCase();
  const memberResults = (membersResult.data ?? [])
    .filter((member) =>
      (member.profiles?.full_name ?? "Team member")
        .toLowerCase()
        .includes(query),
    )
    .slice(0, 4)
    .map((member) => {
      const fullName = member.profiles?.full_name ?? "Team member";

      return {
        context: `${roleLabel(member.role)} in this workspace`,
        href: `/${workspace.slug}/settings/members`,
        id: `member:${member.user_id}`,
        initials: getInitials(fullName),
        title: fullName,
        type: "member" as const,
      };
    });

  return {
    results: [
      ...(tasksResult.data ?? []).flatMap((task) => {
        if (!task.boards) {
          return [];
        }

        return {
          context: [
            task.projects?.name,
            task.boards.name,
            task.board_columns?.name,
          ]
            .filter(Boolean)
            .join(" / "),
          href: `/${workspace.slug}/boards/${task.boards.slug}`,
          id: `task:${task.id}`,
          meta: [priorityLabels[task.priority], task.due_date ?? null]
            .filter(Boolean)
            .join(" · "),
          title: task.title,
          type: "task" as const,
        };
      }),
      ...(boardsResult.data ?? []).map((board) => ({
        context: board.projects?.name
          ? `Board in ${board.projects.name}`
          : "Workspace board",
        href: `/${workspace.slug}/boards/${board.slug}`,
        id: `board:${board.id}`,
        title: board.name,
        type: "board" as const,
      })),
      ...(projectsResult.data ?? []).map((project) => ({
        context: "Project",
        href: `/${workspace.slug}/projects/${project.slug}`,
        id: `project:${project.id}`,
        title: project.name,
        type: "project" as const,
      })),
      ...memberResults,
    ].slice(0, 12),
  };
}

function toIlikePattern(query: string) {
  const sanitized = query.replace(/[%_,]/g, "").trim();

  return sanitized ? `%${sanitized}%` : "";
}

function roleLabel(role: Enums<"app_role">) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
