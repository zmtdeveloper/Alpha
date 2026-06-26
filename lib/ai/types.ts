export type AiActionErrorCode =
  | "invalid-input"
  | "not-authorized"
  | "not-configured"
  | "provider-error"
  | "wrong-plan";

export type AiActionResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      code: AiActionErrorCode;
      message: string;
      ok: false;
    };

export type AiChatRole = "assistant" | "user";

export type AiChatMessage = {
  content: string;
  role: AiChatRole;
};

export type AiUsage = {
  completionTokens?: number;
  promptTokens?: number;
  totalTokens?: number;
};

export type AiProviderConfig = {
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
  model: string;
  provider: "nvidia";
};

export type WorkspaceAiSummary = {
  activeColumnCount: number;
  dueSoonCount: number;
  inProgressCount: number;
  memberCount: number;
  openTaskCount: number;
  projectCount: number;
  userName: string;
  workspaceName: string;
  workspaceSlug: string;
};

export type WorkspaceAiAvailability = {
  enabled: boolean;
  message: string;
  reason: AiActionErrorCode | null;
};
