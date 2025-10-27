import { geminiCall } from '../../utils/geminiCall';
import { logger } from '../../utils/loggers';
import { generateLessonsPrompt } from '../../utils/prompts/lesson-temp';
import { LessonRepository } from './repository';
import { lessonSchema, type GenerateLessonRequest } from './types';

export class LessonService {
  private lessonRepository: LessonRepository;

  constructor(lessonRepository: LessonRepository) {
    this.lessonRepository = lessonRepository;
  }

  public async getLessons(chapterId: string) {
    try {
      const lessons = await this.lessonRepository.getLessons(chapterId);
      return lessons;
    } catch (error) {
      logger.error('Error in LessonService.getLessons:', error);
      throw error;
    }
  }

  public async generateLessons(request: GenerateLessonRequest) {
    try {
      const prompt = generateLessonsPrompt({
        chapterId: request.chapterId,
        chapterTitle: request.chapterTitle,
        chapterDescription: request.chapterDescription,
        chapterOrder: request.chapterOrder,
        learningObjectives: request.learningObjectives,
        keyTopics: request.keyTopics,
        estimatedDuration: request.estimatedDuration,
        estimatedLessonCount: request.estimatedLessonCount,
        courseName: request.courseName,
        level: request.level,
        language: request.language,
      });

      const result = await geminiCall(prompt, {
        responseSchema: lessonSchema,
        temperature: 0.7,
        maxRetries: 3,
      });

      logger.info('Raw Gemini response:', result);

      if (!result.lessons || !Array.isArray(result.lessons)) {
        throw new Error('Invalid response from Gemini: missing lessons array');
      }

      const createdLessons = await this.lessonRepository.createLessons(
        request.chapterId,
        result.lessons
      );

      logger.info(`Successfully created ${createdLessons} lessons`);
      return createdLessons;
    } catch (error) {
      logger.error('Error in LessonService.generateLessons:', error);
      throw error;
    }
  }
}
