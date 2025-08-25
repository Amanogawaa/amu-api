import z from 'zod';
import { AppError } from '../../core/utils/errors';
import { logger } from '../../core/utils/loggers';
import { LessonRepository } from './repository';
import {
  GenerateLessonsRequest,
  GenerateLessonsResponse,
  Lesson,
  LessonResource,
} from './types';
import { generateLessonsPrompt } from '../../core/prompts/lesson-temp';
import { LESSONSCHEMA } from './validation';

export class LessonService {
  private repository: LessonRepository;

  constructor(lessonRepository: LessonRepository) {
    this.repository = lessonRepository;
  }

  async generateAndCreateLessons(
    request: GenerateLessonsRequest
  ): Promise<GenerateLessonsResponse> {
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new AppError('Missing GROQ_API_KEY environment variable', 500);
      }

      const chapterExists = await this.repository.checkChapterExists(
        request.chapterId
      );
      if (!chapterExists) {
        throw new AppError('Chapter not found', 404);
      }

      const lessonsPrompt = generateLessonsPrompt(request);

      const aiResponse = await this.callGroqAPI(lessonsPrompt);

      const parsedLessons = this.parseAIResponse(aiResponse);

      const storedLessons: Lesson[] = [];

      for (let index = 0; index < parsedLessons.lessons.length; index++) {
        const lesson = parsedLessons.lessons[index];

        const lessonOrder = lesson.lessonId?.includes('.')
          ? parseInt(lesson.lessonId.split('.')[1])
          : index + 1;

        const lessonData = {
          chapterId: request.chapterId,
          title: lesson.title,
          type: lesson.type,
          description: lesson.description,
          duration: lesson.duration,
          content: lesson.content || null,
          videoUrl: lesson.videoUrl || null,
          order: lessonOrder,
        };

        const insertedLesson = await this.repository.createLesson(lessonData);

        if (lesson.resources && lesson.resources.length > 0) {
          await this.repository.createLessonResources(
            insertedLesson.id!,
            lesson.resources
          );
        }

        storedLessons.push({
          ...insertedLesson,
          resources: lesson.resources || [],
        });
      }

      const message = `Successfully generated ${storedLessons.length} lessons for chapter: ${request.chapterTitle}`;
      logger.info(message);

      return {
        success: true,
        message,
        lessons: parsedLessons.lessons,
        storedLessons,
      };
    } catch (error) {
      logger.error('Error in LessonService generateAndCreateLessons:', error);
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
            model: 'llama-3.1-8b-instant',
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
      return LESSONSCHEMA.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw error; // Re-throw Zod errors to be handled in controller
      }
      logger.error('Error parsing AI response:', error);
      throw new AppError('Failed to parse AI generated content', 500);
    }
  }

  async getLessonsByChapter(chapterId: string): Promise<Lesson[]> {
    try {
      return await this.repository.getLessonsByChapterId(chapterId);
    } catch (error) {
      logger.error('Error in LessonService getLessonsByChapter:', error);
      throw error;
    }
  }

  async getLessonById(id: string): Promise<Lesson> {
    try {
      return await this.repository.getLessonById(id);
    } catch (error) {
      logger.error('Error in LessonService getLessonById:', error);
      throw error;
    }
  }

  async getLessonResources(lessonId: string): Promise<LessonResource[]> {
    try {
      return await this.repository.getLessonResources(lessonId);
    } catch (error) {
      logger.error('Error in LessonService getLessonResources:', error);
      throw error;
    }
  }
}
