import { GoogleGenAI, MediaResolution } from '@google/genai';
import Bottleneck from 'bottleneck';
import { logger } from './loggers';
import { RATE_LIMIT_CONFIG } from '../config/rateLimit';

interface GeminiConfig {
  responseSchema: any;
  maxRetries?: number;
  temperature?: number;
}

// Create a rate limiter for Gemini API
// This prevents overloading the API with too many requests
const geminiLimiter = new Bottleneck({
  minTime: RATE_LIMIT_CONFIG.GEMINI.MIN_TIME_BETWEEN_REQUESTS,
  maxConcurrent: RATE_LIMIT_CONFIG.GEMINI.MAX_CONCURRENT,
  reservoir: RATE_LIMIT_CONFIG.GEMINI.RESERVOIR,
  reservoirRefreshAmount: RATE_LIMIT_CONFIG.GEMINI.RESERVOIR_REFRESH_AMOUNT,
  reservoirRefreshInterval: RATE_LIMIT_CONFIG.GEMINI.RESERVOIR_REFRESH_INTERVAL,
});

// Handle rate limit errors with exponential backoff
geminiLimiter.on('failed', async (error: any, jobInfo: any) => {
  const id = jobInfo.options.id;
  const retryCount = jobInfo.retryCount || 0;
  
  // Check if it's a rate limit error
  const isRateLimit = 
    error?.message?.includes('quota') ||
    error?.message?.includes('rate limit') ||
    error?.message?.includes('429') ||
    error?.status === 429;

  // Don't retry on critical errors
  if (
    error?.message?.includes('API key') ||
    error?.message?.includes('billing')
  ) {
    logger.error('Critical Gemini API error - not retrying:', {
      error: error.message,
      id,
    });
    return; // Don't retry
  }

  // Retry up to configured max
  const maxRetries = RATE_LIMIT_CONFIG.GEMINI.MAX_RETRIES;
  if (retryCount < maxRetries) {
    const baseDelay = isRateLimit 
      ? RATE_LIMIT_CONFIG.GEMINI.INITIAL_RETRY_WAIT * RATE_LIMIT_CONFIG.GEMINI.RATE_LIMIT_MULTIPLIER
      : RATE_LIMIT_CONFIG.GEMINI.INITIAL_RETRY_WAIT * RATE_LIMIT_CONFIG.GEMINI.NORMAL_ERROR_MULTIPLIER;
    
    const delay = Math.min(
      baseDelay * Math.pow(2, retryCount),
      RATE_LIMIT_CONFIG.GEMINI.MAX_RETRY_WAIT
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

  logger.error('Gemini API failed after max retries', {
    id,
    error: error.message,
    retryCount,
  });
});

// Log when jobs are dropped due to reservoir being empty
geminiLimiter.on('depleted', () => {
  logger.warn('Gemini API rate limit reservoir depleted - requests will be queued');
});

// Internal function to make the actual API call
const makeGeminiCall = async (
  prompt: string,
  config: GeminiConfig
): Promise<any> => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY as string,
  });

  // const model = 'gemini-2.5-pro';
  const model = 'gemini-2.5-flash';

  const contents = [
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    config: {
      temperature: config.temperature || RATE_LIMIT_CONFIG.GEMINI.DEFAULT_TEMPERATURE,
      responseMimeType: 'application/json',
      responseSchema: config.responseSchema,
    },
    contents,
  });

  const text = response.text;
  if (!text || text.trim() === '') {
    throw new Error('Empty response from Gemini');
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    logger.error('JSON parse error:', { text, parseError });
    throw new Error('Invalid JSON response from Gemini');
  }

  logger.info('Gemini API success', {
    promptTokens: response.usageMetadata?.promptTokenCount,
    responseTokens: response.usageMetadata?.candidatesTokenCount,
    totalTokens: response.usageMetadata?.totalTokenCount,
  });

  return parsed;
};

// Export the rate-limited version
export const geminiCall = async (
  prompt: string,
  config: GeminiConfig
): Promise<any> => {
  try {
    // Schedule the API call through the rate limiter
    const result = await geminiLimiter.schedule(
      { id: `gemini-${Date.now()}` },
      () => makeGeminiCall(prompt, config)
    );
    return result;
  } catch (error: any) {
    logger.error('Gemini API call failed:', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
