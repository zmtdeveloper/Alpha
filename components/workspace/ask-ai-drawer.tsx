"use client";

import {
  Bot,
  CheckCircle2,
  LoaderCircle,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  AiActionResult,
  AiChatMessage,
  WorkspaceAiAvailability,
  WorkspaceAiSummary,
} from "@/lib/ai/types";

type AskAiDrawerProps = {
  availability: WorkspaceAiAvailability;
  summary: WorkspaceAiSummary;
  workspaceSlug: string;
};

type WorkspaceAiReply = {
  finishReason: string | null;
  reply: string;
};

const quickPrompts = [
  "What's urgent?",
  "What is due soon?",
  "What needs focus?",
  "Write a status update",
];

export function AskAiDrawer({
  availability,
  summary,
  workspaceSlug,
}: AskAiDrawerProps) {
  if (!availability.enabled) {
    return (
      <div className="flex">
        <Button
          className="px-2 sm:px-3"
          disabled
          size="sm"
          title={availability.message}
          type="button"
          variant="outline"
        >
          <Sparkles />
          <span className="hidden sm:inline">Ask AI</span>
        </Button>
      </div>
    );
  }

  return <EnabledAskAiDrawer summary={summary} workspaceSlug={workspaceSlug} />;
}

function EnabledAskAiDrawer({
  summary,
  workspaceSlug,
}: Pick<AskAiDrawerProps, "summary" | "workspaceSlug">) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [streamStarted, setStreamStarted] = useState(false);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const firstName = useMemo(
    () => getFirstName(summary.userName),
    [summary.userName],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const node = scrollRef.current;

    if (!node) {
      return;
    }

    node.scrollTo({ behavior: "smooth", left: 0, top: node.scrollHeight });
  }, [messages, open, pending]);

  function sendPrompt() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || pending) {
      return;
    }

    const conversation = messages.slice(-8);
    const userMessage: AiChatMessage = {
      content: trimmedPrompt,
      role: "user",
    };

    setMessages((current) => [...current, userMessage]);
    setPrompt("");
    setError(null);
    setStreamStarted(false);

    startTransition(async () => {
      let assistantStarted = false;
      const result = await requestWorkspaceAi({
        conversation,
        onDelta: (delta) => {
          if (!delta) {
            return;
          }

          setStreamStarted(true);
          if (!assistantStarted) {
            assistantStarted = true;

            setMessages((current) => [
              ...current,
              {
                content: delta,
                role: "assistant",
              },
            ]);

            return;
          }

          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];

            if (last?.role !== "assistant") {
              return [
                ...next,
                {
                  content: delta,
                  role: "assistant",
                },
              ];
            }

            next[next.length - 1] = {
              ...last,
              content: `${last.content}${delta}`,
            };

            return next;
          });
        },
        prompt: trimmedPrompt,
        summary,
        workspaceSlug,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (!assistantStarted && result.data.reply) {
        setMessages((current) => [
          ...current,
          {
            content: result.data.reply,
            role: "assistant",
          },
        ]);
      }
    });
  }

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendPrompt();
  }

  function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    sendPrompt();
  }

  function resizePromptInput() {
    const node = textareaRef.current;

    if (!node) {
      return;
    }

    node.style.height = "0px";
    node.style.height = `${Math.min(node.scrollHeight, 128)}px`;
  }

  useEffect(() => {
    resizePromptInput();
  }, [prompt, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="px-2 sm:px-3" size="sm" type="button">
          <Sparkles />
          <span className="hidden sm:inline">Ask AI</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="left-auto right-0 top-0 h-svh w-[min(96vw,42rem)] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-y-0 border-r-0 border-l-border bg-popover p-0 [&>button]:right-5 [&>button]:top-5">
        <div className="flex h-full min-h-svh w-full max-w-full flex-col overflow-hidden bg-popover text-popover-foreground">
          <DialogHeader className="border-b border-border px-6 py-5 pr-14">
            <div className="flex items-center gap-2">
              <span className="task-chip flex size-9 items-center justify-center rounded-md text-primary">
                <Bot className="size-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="truncate text-base font-semibold">
                  Ask about {summary.workspaceName}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Chat across projects in this workspace.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div
            className={cn(
              "min-h-0 w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto bg-background/35 px-6",
              messages.length > 0
                ? "space-y-4 py-5"
                : "flex items-center justify-center py-8",
            )}
            ref={scrollRef}
          >
            {messages.length === 0 ? (
              <AiEmptyState
                firstName={firstName}
                onPromptSelect={setPrompt}
                summary={summary}
              />
            ) : (
              messages.map((message, index) => (
                <ChatBubble
                  key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                  message={message}
                />
              ))
            )}
            {pending && !streamStarted ? (
              <ChatBubble
                message={{
                  content: "Thinking...",
                  role: "assistant",
                }}
                loading
              />
            ) : null}
          </div>

          {error ? (
            <div className="mx-6 mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <form
            className="border-t border-border bg-popover/95 px-5 py-3"
            onSubmit={submitPrompt}
          >
            <div className="flex items-end gap-2 rounded-lg border border-border bg-background/70 p-1.5 shadow-sm shadow-black/10 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/35">
              <label className="min-w-0 flex-1 text-sm">
                <span className="sr-only">Ask a question</span>
                <textarea
                  className={cn(
                    "block max-h-32 min-h-10 w-full resize-none overflow-y-auto border-0 bg-transparent px-2.5 py-2 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
                    pending && "opacity-80",
                  )}
                  disabled={pending}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={handlePromptKeyDown}
                  placeholder={`Ask about ${summary.workspaceName}...`}
                  ref={textareaRef}
                  rows={1}
                  value={prompt}
                />
              </label>
              <Button
                aria-label="Send prompt"
                className="h-10 w-11 shrink-0 rounded-md border border-primary/55 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 [&_svg]:size-4"
                disabled={pending || prompt.trim().length === 0}
                size="icon"
                type="submit"
              >
                {pending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <SendHorizontal />
                )}
              </Button>
            </div>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5" />
              AI suggestions only. Nothing changes automatically.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AiEmptyState({
  firstName,
  onPromptSelect,
  summary,
}: {
  firstName: string;
  onPromptSelect: (prompt: string) => void;
  summary: WorkspaceAiSummary;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
      <span className="task-chip mb-5 flex size-14 items-center justify-center rounded-md text-primary">
        <Bot className="size-6" />
      </span>
      <h2 className="text-xl font-semibold text-foreground">
        Ask about your workspace
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Hi {firstName}, chat across {summary.workspaceName} using the overview
        summary from this workspace.
      </p>
      <div className="mt-5 flex max-w-lg flex-wrap justify-center gap-2">
        {quickPrompts.map((label) => (
          <button
            className="task-chip rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            key={label}
            onClick={() => onPromptSelect(label)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

async function requestWorkspaceAi(input: {
  conversation: AiChatMessage[];
  onDelta?: (delta: string) => void;
  prompt: string;
  summary: WorkspaceAiSummary;
  workspaceSlug: string;
}): Promise<AiActionResult<WorkspaceAiReply>> {
  try {
    const response = await fetch("/api/ai/workspace-chat", {
      body: JSON.stringify(input),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const contentType = response.headers.get("Content-Type") ?? "";

    if (contentType.includes("application/json")) {
      const result = (await response.json()) as unknown;

      if (isAiResponse(result)) {
        return result;
      }
    }

    if (!response.ok || !response.body) {
      return {
        code: "provider-error",
        message: "AI service is temporarily unavailable.",
        ok: false,
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let reply = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const delta = decoder.decode(value, { stream: true });

      if (!delta) {
        continue;
      }

      reply += delta;
      input.onDelta?.(delta);
    }

    reply += decoder.decode();

    return {
      data: {
        finishReason: null,
        reply,
      },
      ok: true,
    };
  } catch {
    return {
      code: "provider-error",
      message: "AI service is temporarily unavailable.",
      ok: false,
    };
  }

  return {
    code: "provider-error",
    message: "AI service returned an unexpected response.",
    ok: false,
  };
}

function isAiResponse(value: unknown): value is AiActionResult<WorkspaceAiReply> {
  return typeof value === "object" && value !== null && "ok" in value;
}

function ChatBubble({
  loading = false,
  message,
}: {
  loading?: boolean;
  message: AiChatMessage;
}) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex w-full min-w-0 max-w-full items-start gap-3 overflow-hidden",
        isAssistant ? "justify-start" : "justify-end",
      )}
    >
      {isAssistant ? (
        <span className="task-chip mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-primary">
          <Bot className="size-3.5" />
        </span>
      ) : null}
      <div
        className={cn(
          "min-w-0 overflow-hidden rounded-md border px-4 py-3 text-sm leading-6 shadow-sm shadow-black/10",
          isAssistant
            ? "task-card w-[min(100%,36rem)] border-border text-foreground"
            : "task-card-active w-[min(86%,34rem)] border-primary/20 text-foreground",
        )}
        style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Thinking
          </span>
        ) : (
          <MessageContent message={message} />
        )}
      </div>
    </div>
  );
}

function MessageContent({ message }: { message: AiChatMessage }) {
  if (message.role === "user") {
    return (
      <span
        className="block max-w-full whitespace-pre-wrap"
        style={{ overflowWrap: "anywhere", wordBreak: "break-all" }}
      >
        {message.content}
      </span>
    );
  }

  return (
    <ReactMarkdown
      components={{
        a: ({ children, href }) => (
          <a
            className="text-primary underline underline-offset-2"
            href={href}
            rel="noreferrer"
            style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            target="_blank"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code
            className="rounded bg-background/80 px-1 py-0.5 font-mono text-[0.85em] text-foreground"
            style={{ overflowWrap: "anywhere", wordBreak: "break-all" }}
          >
            {children}
          </code>
        ),
        h1: ({ children }) => (
          <h1 className="mb-2 text-base font-semibold text-foreground">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 text-base font-semibold text-foreground">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            {children}
          </h3>
        ),
        li: ({ children }) => (
          <li
            className="pl-1"
            style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
          >
            {children}
          </li>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">
            {children}
          </ol>
        ),
        p: ({ children }) => (
          <p
            className="mb-3 whitespace-pre-wrap last:mb-0"
            style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
          >
            {children}
          </p>
        ),
        pre: ({ children }) => (
          <pre className="mb-3 overflow-x-auto rounded-md border border-border bg-background p-3 text-xs leading-5 last:mb-0">
            {children}
          </pre>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-left text-xs">
              {children}
            </table>
          </div>
        ),
        td: ({ children }) => (
          <td className="border border-border px-2 py-1 align-top">
            {children}
          </td>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-background/60 px-2 py-1 font-semibold">
            {children}
          </th>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">
            {children}
          </ul>
        ),
      }}
      remarkPlugins={[remarkGfm]}
    >
      {message.content}
    </ReactMarkdown>
  );
}

function getFirstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || "there";
}
