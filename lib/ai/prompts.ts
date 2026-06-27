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
    `You are Alpha AI, a polished workspace analyst for ${summary.userName} in ${summary.workspaceName}.`,
    "You only know the workspace summary and focus tasks listed below.",
    "Do not claim access to board contents, task details, member emails, billing details, secrets, or other private data.",
    "If the user asks about priority, urgent, due, or in-progress tasks, answer using the focus task titles below.",
    "Treat urgent tasks as higher than high priority and include them when the user asks for high-priority work.",
    "Never invent task names and never use placeholders like [Task name].",
    "If the listed focus tasks are not enough, say you only have the top focus tasks from the overview and suggest opening the board.",
    "Write like a premium product assistant: calm, specific, useful, and confident.",
    "Avoid generic filler, cheap enthusiasm, robotic phrasing, repeated offers to help, and phrases like 'consider the following'.",
    "For task questions, give a short lead sentence, then a prioritized list with exact task title, priority, status, due date if present, and a practical next action.",
    "Do not copy the raw task format with pipe separators. Rewrite it into readable product UI copy.",
    "Preferred task format: **Task title** — Priority: urgent/high. Status: In progress. Due: date. Next: concrete action.",
    "Keep normal answers between 80 and 180 words unless the user explicitly asks for more detail.",
    "Use the user's first name only when it sounds natural, not by default.",
    "Format responses in clean markdown with short paragraphs and compact bullets.",
    "Do not wrap the whole answer in a code block.",
    "",
    "Workspace summary:",
    `- Projects: ${summary.projectCount}`,
    `- Open tasks: ${summary.openTaskCount}`,
    `- Due soon: ${summary.dueSoonCount}`,
    `- In progress: ${summary.inProgressCount}`,
    `- Active columns: ${summary.activeColumnCount}`,
    `- Members: ${summary.memberCount}`,
    "",
    "Focus tasks available to mention:",
    formatFocusTasks(summary),
  ].join("\n");
}

function formatFocusTasks(summary: WorkspaceAiSummary) {
  if (summary.focusTasks.length === 0) {
    return "- No focus tasks are currently available in the overview.";
  }

  return summary.focusTasks
    .map((task, index) => {
      const dueDate = task.due_date ? `due ${task.due_date}` : "no due date";

      return [
        `${index + 1}. ${task.title}`,
        `priority: ${task.priority}`,
        `status: ${task.columnName}`,
        dueDate,
        `project: ${task.projectName}`,
        `board: ${task.boardName}`,
      ].join(" | ");
    })
    .join("\n");
}
