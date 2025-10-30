import { geminiCall } from '../../utils/geminiCall';
import { logger } from '../../utils/loggers';
import { generateChaptersPrompt } from '../../utils/prompts/chapter-temp';
import { ChapterRepository } from './repository';
import { type GenerateChaptersRequest, chaptersSchema } from './types';

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
        moduleId: request.moduleId,
        moduleName: request.moduleName,
        moduleDescription: request.moduleDescription,
        moduleLearningObjectives: request.moduleLearningObjectives,
        moduleKeySkills: request.moduleKeySkills,
        courseName: request.courseName,
        moduleOrder: request.moduleOrder,
        estimatedChapterCount: request.estimatedChapterCount,
        estimatedDuration: request.estimatedDuration,
        level: request.level,
        language: request.language,
      });

      const result = await geminiCall(prompt, {
        responseSchema: chaptersSchema,
        temperature: 0.7,
        maxRetries: 3,
      });

      logger.info('Raw Gemini response:', result);

      if (!result.chapters || !Array.isArray(result.chapters)) {
        throw new Error('Invalid response from Gemini: missing chapters array');
      }

      const createdChapters = await this.chapterRepository.createChapters(
        request.moduleId,
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
