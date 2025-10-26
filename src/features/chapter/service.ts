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
        title: request.title,
        description: request.description,
        noOfChapters: request.noOfChapters,
        duration: request.duration,
        level: request.level,
        language: request.language,
        learningOutcomes: request.learningOutcomes,
      });

      const result = await geminiCall(prompt, chapterSchema);
      const chapterData = JSON.parse(result!);

      logger.info('Raw Gemini response:', result);
      logger.info('Parsed chapter data:', JSON.stringify(chapterData, null, 2));

      if (!chapterData.chapters || !Array.isArray(chapterData.chapters)) {
        throw new Error('Invalid response from Gemini: missing chapters array');
      }

      const createdChapters = await this.chapterRepository.createChapters(
        request.courseId,
        chapterData.chapters
      );

      logger.info(`Successfully created ${createdChapters} chapters`);
      return createdChapters;
    } catch (error) {
      logger.error('Error in ChapterService.generateChapter:', error);
      throw error;
    }
  }
}
