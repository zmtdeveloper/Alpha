import "server-only";

import type { AiUsage } from "@/lib/ai/types";

type LogAiActionInput = {
  actionType: string;
  durationMs: number;
  errorCode?: string | null;
  finishReason?: string | null;
  model: string;
  provider: string;
  status: "failure" | "success";
  tokenUsage?: AiUsage | null;
  userId: string;
  workspaceId: number;
};

export function logAiAction(input: LogAiActionInput) {
  const payload = {
    actionType: input.actionType,
    durationMs: Math.round(input.durationMs),
    errorCode: input.errorCode ?? null,
    finishReason: input.finishReason ?? null,
    model: input.model,
    provider: input.provider,
    status: input.status,
    tokenUsage: input.tokenUsage ?? null,
    userId: input.userId,
    workspaceId: input.workspaceId,
  };

  console.info("[ai-action]", JSON.stringify(payload));
}

