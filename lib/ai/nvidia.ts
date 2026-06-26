import "server-only";

import OpenAI from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";

import type {
  AiActionResult,
  AiChatMessage,
  AiProviderConfig,
  AiUsage,
} from "@/lib/ai/types";
import { buildWorkspaceAiMessages } from "@/lib/ai/prompts";

type GenerateWorkspaceAiReplyInput = {
  conversation: AiChatMessage[];
  prompt: string;
  summary: Parameters<typeof buildWorkspaceAiMessages>[0];
  provider: AiProviderConfig;
};

type NvidiaChatCompletionMessage = {
  content?: string | Array<{ text?: string; type?: string }> | null;
  reasoning?: string | null;
  reasoning_content?: string | null;
};

type NvidiaChatCompletionRequest = ChatCompletionCreateParamsNonStreaming & {
  chat_template_kwargs: {
    reasoning_effort: "high";
    thinking: true;
  };
};

export function getNvidiaConfig(): AiProviderConfig | null {
  const enabled = process.env.AI_FEATURES_ENABLED !== "false";
  const apiKey = firstEnv(
    process.env.NVIDIA_API_KEY,
    process.env.NIM_API_KEY,
  );
  const baseUrl = trimTrailingSlash(
    firstEnv(
      process.env.NVIDIA_API_BASE_URL,
      process.env.NIM_BASE_URL,
      "https://integrate.api.nvidia.com/v1",
    ),
  );
  const model = firstEnv(
    process.env.NVIDIA_AI_MODEL,
    process.env.NIM_MODEL,
    "deepseek-ai/deepseek-v4-flash",
  );

  if (!enabled) {
    return {
      apiKey: "",
      baseUrl,
      enabled: false,
      model,
      provider: "nvidia",
    };
  }

  if (!apiKey || !baseUrl || !model) {
    return null;
  }

  return {
    apiKey,
    baseUrl,
    enabled: true,
    model,
    provider: "nvidia",
  };
}

export function isNvidiaConfigReady(config = getNvidiaConfig()) {
  return Boolean(config?.enabled && config.apiKey && config.baseUrl && config.model);
}

export async function generateWorkspaceAiReply({
  conversation,
  prompt,
  provider,
  summary,
}: GenerateWorkspaceAiReplyInput): Promise<
  AiActionResult<{ finishReason: string | null; reply: string; usage: AiUsage | null }>
> {
  const messages = buildWorkspaceAiMessages(summary, conversation, prompt);
  const client = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseUrl,
  });
  const requestBody: NvidiaChatCompletionRequest = {
    chat_template_kwargs: {
      reasoning_effort: "high",
      thinking: true,
    },
    max_tokens: 16384,
    messages,
    model: provider.model,
    stream: false,
    temperature: 1,
    top_p: 0.95,
  };

  try {
    const completion = await client.chat.completions.create(requestBody);
    const choice = completion.choices[0];
    const message = choice?.message as NvidiaChatCompletionMessage | undefined;
    const reply = extractReply(message);

    if (!reply) {
      return {
        code: "provider-error",
        message: "AI service returned an empty response.",
        ok: false,
      };
    }

    return {
      data: {
        finishReason: choice?.finish_reason ?? null,
        reply,
        usage: normalizeUsage(completion.usage),
      },
      ok: true,
    };
  } catch (error) {
    return {
      code: "provider-error",
      message: safeProviderErrorMessage(error),
      ok: false,
    };
  }
}

function extractReply(message: NvidiaChatCompletionMessage | undefined) {
  const content = message?.content;

  if (typeof content === "string") {
    const trimmed = content.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => part.text ?? "")
      .join("")
      .trim();

    if (text) {
      return text;
    }
  }

  return (message?.reasoning ?? message?.reasoning_content ?? "").trim();
}

function normalizeUsage(usage: {
  completion_tokens?: number;
  prompt_tokens?: number;
  total_tokens?: number;
} | null | undefined): AiUsage | null {
  if (!usage) {
    return null;
  }

  return {
    completionTokens: usage.completion_tokens,
    promptTokens: usage.prompt_tokens,
    totalTokens: usage.total_tokens,
  };
}

function firstEnv(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function safeProviderErrorMessage(error: unknown) {
  if (error instanceof OpenAI.APIError) {
    return error.message || "AI service is temporarily unavailable.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "AI service is temporarily unavailable.";
}
