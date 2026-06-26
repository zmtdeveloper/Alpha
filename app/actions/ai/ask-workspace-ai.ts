"use server";

import { handleWorkspaceAiRequest } from "@/lib/ai/workspace-chat";
import type {
  AiActionResult,
} from "@/lib/ai/types";

export async function askWorkspaceAi(
  input: unknown,
): Promise<
  AiActionResult<{
    finishReason: string | null;
    reply: string;
  }>
> {
  return handleWorkspaceAiRequest(input);
}
