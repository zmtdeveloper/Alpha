import "server-only";

import { performance } from "node:perf_hooks";

import { requireWorkspaceAiAccess } from "@/lib/ai/access";
import { logAiAction } from "@/lib/ai/log-ai-action";
import { generateWorkspaceAiReply } from "@/lib/ai/nvidia";
import type {
  AiActionResult,
  AiChatMessage,
} from "@/lib/ai/types";
import { z } from "zod";

const aiRequestSchema = z.object({
  conversation: z.array(
    z.object({
      content: z.string().trim().min(1).max(500),
      role: z.enum(["assistant", "user"]),
    }),
  ),
  prompt: z.string().trim().min(1).max(2000),
  summary: z.object({
    activeColumnCount: z.number().int().nonnegative(),
    dueSoonCount: z.number().int().nonnegative(),
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

export async function handleWorkspaceAiRequest(
  input: unknown,
): Promise<
  AiActionResult<{
    finishReason: string | null;
    reply: string;
  }>
> {
  const parsed = aiRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      code: "invalid-input",
      message: "Check the AI prompt and try again.",
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

  const conversation = parsed.data.conversation.slice(-8) as AiChatMessage[];
  const result = await generateWorkspaceAiReply({
    conversation,
    prompt: parsed.data.prompt,
    provider: access.config,
    summary: parsed.data.summary,
  });

  logAiAction({
    actionType: "workspace-chat",
    durationMs: performance.now() - startedAt,
    errorCode: result.ok ? null : result.code,
    finishReason: result.ok ? result.data.finishReason : null,
    model: access.config.model,
    provider: access.config.provider,
    status: result.ok ? "success" : "failure",
    tokenUsage: result.ok ? result.data.usage : null,
    userId: access.userId,
    workspaceId: access.workspace.id,
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
