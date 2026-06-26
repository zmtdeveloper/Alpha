import { handleWorkspaceAiRequest } from "@/lib/ai/workspace-chat";
import type { AiActionErrorCode } from "@/lib/ai/types";

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

  const result = await handleWorkspaceAiRequest(body);

  return Response.json(result, {
    status: result.ok ? 200 : statusForAiError(result.code),
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
