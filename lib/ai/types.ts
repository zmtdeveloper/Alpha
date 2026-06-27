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
  focusTasks: WorkspaceAiSummaryTask[];
  inProgressCount: number;
  memberCount: number;
  openTaskCount: number;
  projectCount: number;
  userName: string;
  workspaceName: string;
  workspaceSlug: string;
};

export type WorkspaceAiSummaryTask = {
  boardName: string;
  boardSlug: string;
  columnName: string;
  due_date: string | null;
  id: number;
  priority: "none" | "low" | "medium" | "high" | "urgent";
  projectName: string;
  title: string;
};

export type WorkspaceAiAvailability = {
  enabled: boolean;
  message: string;
  reason: AiActionErrorCode | null;
};
