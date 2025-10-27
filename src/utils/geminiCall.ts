import { GoogleGenAI, MediaResolution } from '@google/genai';
import { logger } from './loggers';

interface GeminiConfig {
  responseSchema: any;
  maxRetries?: number;
  temperature?: number;
}

export const geminiCall = async (
  prompt: string,
  config: GeminiConfig
): Promise<any> => {
  const maxRetries = config.maxRetries || 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY as string,
      });

      // const model = 'gemini-2.5-pro';
      const model = 'gemini-2.0-flash-exp';

      const contents = [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ];

      const response = await ai.models.generateContent({
        model,
        config: {
          temperature: config.temperature || 0.7,
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
        attempt,
        promptTokens: response.usageMetadata?.promptTokenCount,
        responseTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount,
      });

      return parsed;
    } catch (error: any) {
      lastError = error;
      logger.warn(`Gemini API attempt ${attempt}/${maxRetries} failed:`, {
        error: error.message,
        attempt,
      });

      if (
        error.message?.includes('API key') ||
        error.message?.includes('quota') ||
        error.message?.includes('billing')
      ) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error('Gemini API failed after all retries:', lastError);
  throw new Error(
    `Gemini API failed after ${maxRetries} attempts: ${lastError.message}`
  );
};
