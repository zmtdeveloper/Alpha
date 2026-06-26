import type { AiChatMessage, WorkspaceAiSummary } from "@/lib/ai/types";

export function buildWorkspaceAiMessages(
  summary: WorkspaceAiSummary,
  conversation: AiChatMessage[],
  prompt: string,
) {
  return [
    {
      content: buildWorkspaceAiSystemPrompt(summary),
      role: "system" as const,
    },
    ...conversation.map((message) => ({
      content: message.content,
      role: message.role,
    })),
    {
      content: prompt.trim(),
      role: "user" as const,
    },
  ];
}

function buildWorkspaceAiSystemPrompt(summary: WorkspaceAiSummary) {
  return [
    `You are a workspace assistant for ${summary.userName} in ${summary.workspaceName}.`,
    "You only know the high-level workspace summary below.",
    "Do not claim access to board contents, task details, member emails, billing details, secrets, or other private data.",
    "If the user asks for task-level or board-level details, say you cannot see that from this overview and suggest opening the relevant board or task.",
    "Be concise, practical, and direct, but make the answer feel personal to the user and workspace.",
    "Use the user's first name naturally when it helps, but not in every sentence.",
    "Format responses in clean markdown with short paragraphs, bullet lists, and bold labels where useful.",
    "Do not wrap the whole answer in a code block.",
    "",
    "Workspace summary:",
    `- Projects: ${summary.projectCount}`,
    `- Open tasks: ${summary.openTaskCount}`,
    `- Due soon: ${summary.dueSoonCount}`,
    `- In progress: ${summary.inProgressCount}`,
    `- Active columns: ${summary.activeColumnCount}`,
    `- Members: ${summary.memberCount}`,
  ].join("\n");
}
