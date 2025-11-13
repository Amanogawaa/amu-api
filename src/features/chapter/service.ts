import { AppError } from '../../utils/errors';
import { geminiCall } from '../../utils/geminiCall';
import { logger } from '../../utils/loggers';
import { generateChaptersPrompt } from '../../utils/prompts/chapter-temp';
import { ChapterRepository } from './repository';
import {
  type GenerateChaptersRequest,
  type RegenerateChaptersRequest,
  type Chapter,
  chaptersSchema,
} from './types';

export class ChapterService {
  private chapterRepository: ChapterRepository;

  constructor(chapterRepository: ChapterRepository) {
    this.chapterRepository = chapterRepository;
  }

  public async getChapters(moduleId: string) {
    try {
      const chapters = await this.chapterRepository.getChapters(moduleId);
      return chapters;
    } catch (error) {
      logger.error('Error in ChapterService.getChapters:', error);
      throw error;
    }
  }

  public async getChapter(chapterId: string) {
    try {
      const chapter = await this.chapterRepository.getChapter(chapterId);
      return chapter;
    } catch (error) {
      logger.error('Error in ChapterService.getChapter:', error);
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

  public async regenerateChapters(request: RegenerateChaptersRequest) {
    try {
      const existingChapters = await this.chapterRepository.getChapters(
        request.moduleId
      );

      if (existingChapters.length === 0) {
        throw new AppError(
          'No existing chapters found. Use generateChapters instead.',
          404
        );
      }

      logger.info(
        `Found ${existingChapters.length} existing chapters for moduleId: ${request.moduleId}`
      );

      existingChapters.sort((a, b) => a.chapterOrder - b.chapterOrder);

      const enhancedPrompt = this.buildRegenerationPrompt(request);

      const result = await geminiCall(enhancedPrompt, {
        responseSchema: chaptersSchema,
        temperature: 0.8,
        maxRetries: 3,
      });

      if (!result.chapters || !Array.isArray(result.chapters)) {
        throw new Error('Invalid response from Gemini: missing chapters array');
      }

      if (result.chapters.length !== existingChapters.length) {
        logger.warn(
          `AI generated ${result.chapters.length} chapters but expected ${existingChapters.length}`
        );
      }

      const updatedChapters: Chapter[] = existingChapters.map(
        (existing, index) => {
          const newContent = result.chapters[index] || result.chapters[0];
          return {
            ...existing,
            ...newContent,
            id: existing.id,
            moduleId: existing.moduleId,
            courseName: existing.courseName,
            moduleName: existing.moduleName,
            chapterOrder: existing.chapterOrder,
            createdAt: existing.createdAt,
          };
        }
      );

      const updateResult = await this.chapterRepository.updateChaptersBatch(
        updatedChapters
      );

      logger.info(
        `Regenerated ${updateResult.updated} chapters. Errors: ${updateResult.errors.length}`
      );

      return {
        updated: updateResult.updated,
        errors: updateResult.errors,
        chapters: updatedChapters,
      };
    } catch (error) {
      logger.error('Error in ChapterService.regenerateChapters:', error);
      throw error;
    }
  }

  private buildRegenerationPrompt(request: RegenerateChaptersRequest): string {
    const basePrompt = generateChaptersPrompt({
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

    if (request.userInstructions) {
      return `${basePrompt}\n\n**IMPORTANT USER FEEDBACK FOR REGENERATION:**\n${request.userInstructions}\n\nPlease adjust the content based on the above feedback while maintaining the same structure and number of chapters.`;
    }

    return `${basePrompt}\n\n**NOTE:** This is a regeneration request. Please provide fresh, alternative content while maintaining educational quality and structure.`;
  }

  public async deleteChaptersByModuleId(moduleId: string) {
    try {
      await this.chapterRepository.deleteChaptersByModuleId(moduleId);
    } catch (error) {
      logger.error('Error in ChapterService.deleteChaptersByModuleId:', error);
      throw error;
    }
  }
}
