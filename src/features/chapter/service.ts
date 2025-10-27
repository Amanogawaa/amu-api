import { geminiCall } from '../../utils/geminiCall';
import { logger } from '../../utils/loggers';
import { generateChaptersPrompt } from '../../utils/prompts/chapter-temp';
import { ChapterRepository } from './repository';
import { type GenerateChaptersRequest, chapterSchema } from './types';

export class ChapterService {
  private chapterRepository: ChapterRepository;

  constructor(chapterRepository: ChapterRepository) {
    this.chapterRepository = chapterRepository;
  }

  public async getChapters(courseId: string) {
    try {
      const chapters = await this.chapterRepository.getChapters(courseId);
      return chapters;
    } catch (error) {
      logger.error('Error in ChapterService.getChapters:', error);
      throw error;
    }
  }

  public async generateChapters(request: GenerateChaptersRequest) {
    try {
      const prompt = generateChaptersPrompt({
        courseId: request.courseId,
        courseName: request.courseName,
        description: request.description,
        noOfChapters: request.noOfChapters,
        duration: request.duration,
        level: request.level,
        language: request.language,
        learningOutcomes: request.learningOutcomes,
        prerequisites: request.prerequisites || 'None',
      });

      const result = await geminiCall(prompt, {
        responseSchema: chapterSchema,
        temperature: 0.7,
        maxRetries: 3,
      });

      logger.info('Raw Gemini response:', result);

      if (!result.chapters || !Array.isArray(result.chapters)) {
        throw new Error('Invalid response from Gemini: missing chapters array');
      }

      const createdChapters = await this.chapterRepository.createChapters(
        request.courseId,
        request.courseName,
        result.chapters
      );

      logger.info(`Successfully created ${createdChapters} chapters`);
      return createdChapters;
    } catch (error) {
      logger.error('Error in ChapterService.generateChapter:', error);
      throw error;
    }
  }
}
