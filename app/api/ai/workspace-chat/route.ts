import { logAiAction } from "@/lib/ai/log-ai-action";
import {
  extractStreamTextDelta,
  streamWorkspaceAiReply,
} from "@/lib/ai/nvidia";
import { prepareWorkspaceAiRequest } from "@/lib/ai/workspace-chat";
import type { AiActionErrorCode } from "@/lib/ai/types";
import { performance } from "node:perf_hooks";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        code: "invalid-input",
        message: "Check the AI prompt and try again.",
        ok: false,
      },
      { status: 400 },
    );
  }

  const prepared = await prepareWorkspaceAiRequest(body);

  if (!prepared.ok) {
    return Response.json(prepared, {
      status: statusForAiError(prepared.code),
    });
  }

  const encoder = new TextEncoder();
  const {
    config,
    conversation,
    prompt,
    startedAt,
    summary,
    userId,
    workspace,
  } = prepared.data;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let finishReason: string | null = null;
      let streamed = false;

      try {
        const completionStream = await streamWorkspaceAiReply({
          conversation,
          prompt,
          provider: config,
          summary,
        });

        for await (const chunk of completionStream) {
          const choice = chunk.choices[0];
          const text = extractStreamTextDelta(choice?.delta);

          finishReason = choice?.finish_reason ?? finishReason;

          if (!text) {
            continue;
          }

          streamed = true;
          controller.enqueue(encoder.encode(text));
        }

        logAiAction({
          actionType: "workspace-chat",
          durationMs: performance.now() - startedAt,
          errorCode: null,
          finishReason,
          model: config.model,
          provider: config.provider,
          status: "success",
          tokenUsage: null,
          userId,
          workspaceId: workspace.id,
        });
        controller.close();
      } catch (error) {
        logAiAction({
          actionType: "workspace-chat",
          durationMs: performance.now() - startedAt,
          errorCode: "provider-error",
          finishReason,
          model: config.model,
          provider: config.provider,
          status: "failure",
          tokenUsage: null,
          userId,
          workspaceId: workspace.id,
        });

        if (!streamed) {
          controller.error(error);
          return;
        }

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
    status: 200,
  });
}

function statusForAiError(code: AiActionErrorCode) {
  switch (code) {
    case "invalid-input":
      return 400;
    case "not-authorized":
      return 401;
    case "wrong-plan":
      return 403;
    case "not-configured":
      return 503;
    case "provider-error":
      return 502;
  }
}
