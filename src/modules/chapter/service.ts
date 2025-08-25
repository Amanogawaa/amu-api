import { AppError } from '../../core/utils/errors';
import { logger } from '../../core/utils/loggers';
import { ChapterRepository } from './repository';
import {
  GenerateChaptersRequest,
  GenerateChaptersResponse,
  Chapter,
} from './types';
import { generateChaptersPrompt } from '../../core/prompts/chapter-temp';
import { CHAPTERSCHEMA } from './validation';

export class ChapterService {
  private repository: ChapterRepository;

  constructor(chapterRepository: ChapterRepository) {
    this.repository = chapterRepository;
  }

  async generateAndCreateChapters(
    request: GenerateChaptersRequest
  ): Promise<GenerateChaptersResponse> {
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new AppError('Missing GROQ_API_KEY environment variable', 500);
      }

      const chapterPrompt = generateChaptersPrompt(request);

      const aiResponse = await this.callGroqAPI(chapterPrompt);

      const parsedChapters = this.parseAIResponse(aiResponse);

      const chaptersToCreate = parsedChapters.chapters.map(
        (chapter: any, index: number) => ({
          courseId: request.courseId,
          title: chapter.title,
          description: chapter.description,
          estimatedDuration: chapter.estimatedDuration,
          order: chapter.chapterId || index + 1,
        })
      );

      const storedChapters = await this.repository.createChapter(
        chaptersToCreate
      );

      logger.info(
        `Generated and stored ${storedChapters.length} chapters for course: ${request.courseId}`
      );

      return {
        success: true,
        chapters: storedChapters,
      };
    } catch (error) {
      logger.error('Error in ChapterService generateAndCreateChapters:', error);
      throw error;
    }
  }

  private async callGroqAPI(prompt: string): Promise<any> {
    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new AppError(
          `Groq API error: ${errorData.error?.message || response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      logger.error('Error calling Groq API:', error);
      throw error;
    }
  }

  private parseAIResponse(data: any): any {
    try {
      const generatedContent = data.choices[0].message.content;
      const parsed = JSON.parse(generatedContent);
      return CHAPTERSCHEMA.parse(parsed);
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      throw new AppError('Failed to parse AI generated content', 500);
    }
  }

  async getChaptersByCourse(courseId: string): Promise<Chapter[]> {
    try {
      return await this.repository.getChaptersByCourseId(courseId);
    } catch (error) {
      logger.error('Error in ChapterService getChaptersByCourse:', error);
      throw error;
    }
  }
}
