import { GoogleGenAI, MediaResolution } from '@google/genai';
import { logger } from './loggers';

export const geminiCall = async (prompt: string, config: any) => {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY as string,
    });
    const model = 'gemini-2.5-pro';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model,
      config: {
        thinkingConfig: {
          thinkingBudget: -1,
        },
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
        responseMimeType: 'application/json',
        responseSchema: config,
      },
      contents,
    });

    return response.text;
  } catch (error) {
    logger.error('Error in CoursesService.geminiCall:', error);
    throw error;
  }
};
