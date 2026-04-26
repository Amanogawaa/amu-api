/* eslint-disable @typescript-eslint/no-explicit-any */
import { RATE_LIMIT_CONFIG } from "@config/rateLimit";
import { GoogleGenAI } from "@google/genai";
import Bottleneck from "bottleneck";
import { logger } from "core/utils/loggers";

interface GeminiConfig {
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

const geminiLimiter = new Bottleneck({
  minTime: RATE_LIMIT_CONFIG.GEMINI.MIN_TIME_BETWEEN_REQUESTS,
  maxConcurrent: RATE_LIMIT_CONFIG.GEMINI.MAX_CONCURRENT,
  reservoir: RATE_LIMIT_CONFIG.GEMINI.RESERVOIR,
  reservoirRefreshAmount: RATE_LIMIT_CONFIG.GEMINI.RESERVOIR_REFRESH_AMOUNT,
  reservoirRefreshInterval: RATE_LIMIT_CONFIG.GEMINI.RESERVOIR_REFRESH_INTERVAL,
});

geminiLimiter.on("failed", async (error: any, jobInfo: any) => {
  const id = jobInfo.options.id;
  const retryCount = jobInfo.retryCount || 0;

  const isRateLimit =
    error?.message?.includes("quota") ||
    error?.message?.includes("rate limit") ||
    error?.message?.includes("429") ||
    error?.status === 429;

  if (
    error?.message?.includes("API key") ||
    error?.message?.includes("billing")
  ) {
    logger.error("Critical Gemini API error - not retrying:", {
      error: error.message,
      id,
    });
  }

  const maxRetries = RATE_LIMIT_CONFIG.GEMINI.MAX_RETRIES;
  if (retryCount < maxRetries) {
    const baseDelay = isRateLimit
      ? RATE_LIMIT_CONFIG.GEMINI.INITIAL_RETRY_WAIT *
        RATE_LIMIT_CONFIG.GEMINI.RATE_LIMIT_MULTIPLIER
      : RATE_LIMIT_CONFIG.GEMINI.INITIAL_RETRY_WAIT *
        RATE_LIMIT_CONFIG.GEMINI.NORMAL_ERROR_MULTIPLIER;

    const delay = Math.min(
      baseDelay * Math.pow(2, retryCount),
      RATE_LIMIT_CONFIG.GEMINI.MAX_RETRY_WAIT,
    );

    logger.warn(`Gemini API failed, retrying in ${delay}ms...`, {
      id,
      attempt: retryCount + 1,
      maxRetries,
      isRateLimit,
      error: error.message,
    });
    return delay;
  }

  logger.error("Gemini API failed after max retries", {
    id,
    error: error.message,
    retryCount,
  });
});

geminiLimiter.on("depleted", () => {
  logger.warn(
    "Gemini API rate limit reservoir depleted - requests will be queued",
  );
});

const makeGeminiCall = async (
  prompt: string,
  config: GeminiConfig,
): Promise<any> => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY as string,
  });


  const contents = [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  const requestPayload: any = {
    model: RATE_LIMIT_CONFIG.GEMINI.DEFAULT_MODEL,
    config: {
      temperature:
        config.temperature || RATE_LIMIT_CONFIG.GEMINI.DEFAULT_TEMPERATURE,
      responseMimeType: config.responseSchema
        ? "application/json"
        : "text/plain",
      responseSchema: config.responseSchema ?? undefined,
    },
    contents,
  };

  if (config.systemPrompt) {
    requestPayload.systemInstruction = {
      role: "system",
      parts: [{ text: config.systemPrompt }],
    };
  }

  const start = Date.now();
  const timeoutMs =
    config.timeoutMs ??
    (process.env.GEMINI_TIMEOUT_MS
      ? Number(process.env.GEMINI_TIMEOUT_MS)
      : 120_000);

  const withTimeout = async <T>(p: Promise<T>, label: string): Promise<T> => {
    if (!timeoutMs || Number.isNaN(timeoutMs) || timeoutMs <= 0) {
      return await p;
    }

    let timeoutHandle: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(
          new Error(`Gemini request timed out after ${timeoutMs}ms (${label})`),
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
    logger.info("Gemini API request started (streaming)", {
      timeoutMs,
      benchmarkTag: config.benchmarkTag ?? "default",
      metadata: config.metadata,
    });

    const stream = await withTimeout(
      ai.models.generateContentStream(requestPayload),
      "generateContentStream",
    );
    let fullResponse = "";

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        await config.onChunk(text);
      }
    }

    const durationMs = Date.now() - start;

    logger.info("Gemini API success (streaming)", {
      durationMs,
      benchmarkTag: config.benchmarkTag ?? "default",
      metadata: config.metadata,
    });

    return fullResponse;
  }

  logger.info("Gemini API request started", {
    timeoutMs,
    benchmarkTag: config.benchmarkTag ?? "default",
    metadata: config.metadata,
  });

  const response = await withTimeout(
    ai.models.generateContent(requestPayload),
    "generateContent",
  );
  const durationMs = Date.now() - start;

  const text = response.text;
  if (!text || text.trim() === "") {
    throw new Error("Empty response from Gemini");
  }

  if (!config.responseSchema) {
    logger.info("Gemini API success (plain text)", {
      promptTokens: response.usageMetadata?.promptTokenCount,
      responseTokens: response.usageMetadata?.candidatesTokenCount,
      totalTokens: response.usageMetadata?.totalTokenCount,
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
    throw new Error("Invalid JSON response from Gemini");
  }

  logger.info("Gemini API success", {
    promptTokens: response.usageMetadata?.promptTokenCount,
    responseTokens: response.usageMetadata?.candidatesTokenCount,
    totalTokens: response.usageMetadata?.totalTokenCount,
    durationMs,
    benchmarkTag: config.benchmarkTag ?? "default",
    metadata: config.metadata,
  });

  return parsed;
};

export const geminiCall = async (
  prompt: string,
  config: GeminiConfig,
): Promise<any> => {
  try {
    const uniqueId = `gemini-${Date.now()}-${++jobCounter}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const result = await geminiLimiter.schedule({ id: uniqueId }, () =>
      makeGeminiCall(prompt, config),
    );
    return result;
  } catch (error: any) {
    logger.error("Gemini API call failed:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
