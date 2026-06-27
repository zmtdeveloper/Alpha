import "server-only";

import { performance } from "node:perf_hooks";

import { requireWorkspaceAiAccess } from "@/lib/ai/access";
import { logAiAction } from "@/lib/ai/log-ai-action";
import { generateWorkspaceAiReply } from "@/lib/ai/nvidia";
import type {
  AiActionResult,
  AiChatMessage,
  AiProviderConfig,
  WorkspaceAiSummary,
} from "@/lib/ai/types";
import { getWorkspaceOverviewData } from "@/lib/workspace/data";
import { z } from "zod";

const aiSummaryTaskSchema = z.object({
  boardName: z.string().trim().min(1).max(120),
  boardSlug: z.string().trim().min(1).max(120),
  columnName: z.string().trim().min(1).max(120),
  due_date: z.string().trim().max(32).nullable(),
  id: z.number().int().positive(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]),
  projectName: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(240),
});

const aiRequestSchema = z.object({
  conversation: z.array(
    z.object({
      content: z.string().trim().min(1).max(8000),
      role: z.enum(["assistant", "user"]),
    }),
  ),
  prompt: z.string().trim().min(1).max(2000),
  summary: z.object({
    activeColumnCount: z.number().int().nonnegative(),
    dueSoonCount: z.number().int().nonnegative(),
    focusTasks: z.array(aiSummaryTaskSchema).max(8).default([]),
    inProgressCount: z.number().int().nonnegative(),
    memberCount: z.number().int().nonnegative(),
    openTaskCount: z.number().int().nonnegative(),
    projectCount: z.number().int().nonnegative(),
    userName: z.string().trim().min(1).max(120),
    workspaceName: z.string().trim().min(1).max(120),
    workspaceSlug: z.string().trim().min(1).max(120),
  }),
  workspaceSlug: z.string().trim().min(1).max(120),
});

export type PreparedWorkspaceAiRequest = {
  config: AiProviderConfig;
  conversation: AiChatMessage[];
  prompt: string;
  startedAt: number;
  summary: WorkspaceAiSummary;
  userId: string;
  workspace: {
    id: number;
    name: string;
    slug: string;
  };
};

export async function handleWorkspaceAiRequest(
  input: unknown,
): Promise<
  AiActionResult<{
    finishReason: string | null;
    reply: string;
  }>
> {
  const prepared = await prepareWorkspaceAiRequest(input);

  if (!prepared.ok) {
    return prepared;
  }

  const {
    config,
    conversation,
    prompt,
    startedAt,
    summary,
    userId,
    workspace,
  } = prepared.data;
  const result = await generateWorkspaceAiReply({
    conversation,
    prompt,
    provider: config,
    summary,
  });

  logAiAction({
    actionType: "workspace-chat",
    durationMs: performance.now() - startedAt,
    errorCode: result.ok ? null : result.code,
    finishReason: result.ok ? result.data.finishReason : null,
    model: config.model,
    provider: config.provider,
    status: result.ok ? "success" : "failure",
    tokenUsage: result.ok ? result.data.usage : null,
    userId,
    workspaceId: workspace.id,
  });

  if (!result.ok) {
    return result;
  }

  return {
    data: {
      finishReason: result.data.finishReason,
      reply: result.data.reply,
    },
    ok: true,
  };
}

export async function prepareWorkspaceAiRequest(
  input: unknown,
): Promise<AiActionResult<PreparedWorkspaceAiRequest>> {
  const parsed = aiRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      code: "invalid-input",
      message: "The prompt or recent chat context is too large. Try again.",
      ok: false,
    };
  }

  const startedAt = performance.now();
  const access = await requireWorkspaceAiAccess(parsed.data.workspaceSlug);

  if ("error" in access && access.error) {
    logAiAction({
      actionType: "workspace-chat",
      durationMs: performance.now() - startedAt,
      errorCode: access.error.code,
      model: "n/a",
      provider: "nvidia",
      status: "failure",
      userId: access.userId ?? "unknown",
      workspaceId: access.workspace?.id ?? 0,
    });

    return {
      code: access.error.code,
      message: access.error.message,
      ok: false,
    };
  }

  const conversation = parsed.data.conversation
    .slice(-8)
    .map((message) => ({
      content: trimConversationContent(message.content),
      role: message.role,
    })) as AiChatMessage[];
  const overviewData = await getWorkspaceOverviewData(parsed.data.workspaceSlug);
  const summary: WorkspaceAiSummary = {
    activeColumnCount: overviewData.activeColumnCount,
    dueSoonCount: overviewData.dueSoonCount,
    focusTasks: overviewData.focusTasks,
    inProgressCount: overviewData.inProgressCount,
    memberCount: overviewData.memberCount,
    openTaskCount: overviewData.openTaskCount,
    projectCount: overviewData.projectCount,
    userName: parsed.data.summary.userName,
    workspaceName: overviewData.workspace.name,
    workspaceSlug: overviewData.workspace.slug,
  };

  return {
    data: {
      config: access.config,
      conversation,
      prompt: parsed.data.prompt,
      startedAt,
      summary,
      userId: access.userId,
      workspace: access.workspace,
    },
    ok: true,
  };
}

function trimConversationContent(content: string) {
  const normalized = content.trim();

  if (normalized.length <= 2000) {
    return normalized;
  }

  return normalized.slice(-2000);
}
