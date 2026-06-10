/* eslint-disable @typescript-eslint/no-explicit-any */
import Groq from "groq-sdk";
import Bottleneck from "bottleneck";
import { RATE_LIMIT_CONFIG } from "../config/rateLimit";
import { logger } from "./loggers";

interface GroqConfig {
  responseSchema?: any;
  maxRetries?: number;
  temperature?: number;
  systemPrompt?: string;
  benchmarkTag?: string;
  metadata?: Record<string, unknown>;
  stream?: boolean;
  onChunk?: (chunk: string) => void | Promise<void>;
  timeoutMs?: number;
}

let jobCounter = 0;

const groqLimiter = new Bottleneck({
  minTime: RATE_LIMIT_CONFIG.GROQ.MIN_TIME_BETWEEN_REQUESTS,
  maxConcurrent: RATE_LIMIT_CONFIG.GROQ.MAX_CONCURRENT,
  reservoir: RATE_LIMIT_CONFIG.GROQ.RESERVOIR,
  reservoirRefreshAmount: RATE_LIMIT_CONFIG.GROQ.RESERVOIR_REFRESH_AMOUNT,
  reservoirRefreshInterval: RATE_LIMIT_CONFIG.GROQ.RESERVOIR_REFRESH_INTERVAL,
});

groqLimiter.on("failed", async (error: any, jobInfo: any) => {
  const id = jobInfo.options.id;
  const retryCount = jobInfo.retryCount || 0;

  const isRateLimit =
    error?.message?.includes("rate limit") ||
    error?.message?.includes("429") ||
    error?.status === 429;

  const maxRetries = RATE_LIMIT_CONFIG.GROQ.MAX_RETRIES;
  if (retryCount < maxRetries) {
    const baseDelay = isRateLimit
      ? RATE_LIMIT_CONFIG.GROQ.INITIAL_RETRY_WAIT *
        RATE_LIMIT_CONFIG.GROQ.RATE_LIMIT_MULTIPLIER
      : RATE_LIMIT_CONFIG.GROQ.INITIAL_RETRY_WAIT *
        RATE_LIMIT_CONFIG.GROQ.NORMAL_ERROR_MULTIPLIER;

    const delay = Math.min(
      baseDelay * Math.pow(2, retryCount),
      RATE_LIMIT_CONFIG.GROQ.MAX_RETRY_WAIT,
    );

    logger.warn(`Groq API failed, retrying in ${delay}ms...`, {
      id,
      attempt: retryCount + 1,
      maxRetries,
      isRateLimit,
      error: error.message,
    });
    return delay;
  }

  logger.error("Groq API failed after max retries", {
    id,
    error: error.message,
    retryCount,
  });
});

const makeGroqCall = async (
  prompt: string,
  config: GroqConfig,
): Promise<any> => {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY as string,
  });

  const model = "llama-3.3-70b-versatile"; // Default versatile model

  const messages: any[] = [];

  let systemContent = config.systemPrompt || "";

  if (config.responseSchema) {
    // Groq requires JSON mode instructions in the system prompt
    const schemaInstruction = `\n\nIMPORTANT: You must respond ONLY with a valid JSON object. The JSON object must strictly follow this schema:\n${JSON.stringify(config.responseSchema)}`;
    systemContent += schemaInstruction;
  }

  if (systemContent) {
    messages.push({ role: "system", content: systemContent });
  }

  messages.push({ role: "user", content: prompt });

  const start = Date.now();
  const timeoutMs =
    config.timeoutMs ??
    (process.env.GROQ_TIMEOUT_MS
      ? Number(process.env.GROQ_TIMEOUT_MS)
      : 120_000);

  const requestPayload: any = {
    model,
    messages,
    temperature:
      config.temperature || RATE_LIMIT_CONFIG.GROQ.DEFAULT_TEMPERATURE,
    response_format: config.responseSchema
      ? { type: "json_object" }
      : { type: "text" },
  };

  const withTimeout = async <T>(p: Promise<T>, label: string): Promise<T> => {
    if (!timeoutMs || Number.isNaN(timeoutMs) || timeoutMs <= 0) {
      return await p;
    }

    let timeoutHandle: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(
          new Error(`Groq request timed out after ${timeoutMs}ms (${label})`),
        );
      }, timeoutMs);
    });

    try {
      return await Promise.race([p, timeoutPromise]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  };

  if (config.stream && config.onChunk) {
    logger.info("Groq API request started (streaming)", {
      timeoutMs,
      benchmarkTag: config.benchmarkTag ?? "default",
      metadata: config.metadata,
    });

    requestPayload.stream = true;
    const stream = (await withTimeout(
      groq.chat.completions.create(requestPayload),
      "chat.completions.create (stream)",
    )) as any;

    let fullResponse = "";

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        fullResponse += text;
        await config.onChunk(text);
      }
    }

    const durationMs = Date.now() - start;

    logger.info("Groq API success (streaming)", {
      durationMs,
      benchmarkTag: config.benchmarkTag ?? "default",
      metadata: config.metadata,
    });

    return fullResponse;
  }

  logger.info("Groq API request started", {
    timeoutMs,
    benchmarkTag: config.benchmarkTag ?? "default",
    metadata: config.metadata,
  });

  const response = (await withTimeout(
    groq.chat.completions.create(requestPayload),
    "chat.completions.create",
  )) as any;

  const durationMs = Date.now() - start;

  const text = response.choices[0]?.message?.content;
  if (!text || text.trim() === "") {
    throw new Error("Empty response from Groq");
  }

  if (!config.responseSchema) {
    logger.info("Groq API success (plain text)", {
      promptTokens: response.usage?.prompt_tokens,
      responseTokens: response.usage?.completion_tokens,
      totalTokens: response.usage?.total_tokens,
      durationMs,
      benchmarkTag: config.benchmarkTag ?? "default",
      metadata: config.metadata,
    });

    return text;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    logger.error("JSON parse error:", { text, parseError });
    throw new Error("Invalid JSON response from Groq");
  }

  logger.info("Groq API success", {
    promptTokens: response.usage?.prompt_tokens,
    responseTokens: response.usage?.completion_tokens,
    totalTokens: response.usage?.total_tokens,
    durationMs,
    benchmarkTag: config.benchmarkTag ?? "default",
    metadata: config.metadata,
  });

  return parsed;
};

export const groqCall = async (
  prompt: string,
  config: GroqConfig,
): Promise<any> => {
  try {
    const uniqueId = `groq-${Date.now()}-${++jobCounter}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const result = await groqLimiter.schedule({ id: uniqueId }, () =>
      makeGroqCall(prompt, config),
    );
    return result;
  } catch (error: any) {
    logger.error("Groq API call failed:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
