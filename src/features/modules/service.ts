import { AppError } from '../../utils/errors';
import { geminiCall } from '../../utils/geminiCall';
import { logger } from '../../utils/loggers';
import { generateModulesPrompt } from '../../utils/prompts/module-temp';
import type { ModuleRepository } from './repository';
import {
  modulesSchema,
  type GenerateModulesRequest,
  type Module,
  type UpdateModuleRequest,
} from './types';

export class ModuleService {
  private repository: ModuleRepository;

  constructor(repository: ModuleRepository) {
    this.repository = repository;
  }

  public async getModules(courseId: string) {
    try {
      const modules = await this.repository.getModules(courseId);
      return modules;
    } catch (error) {
      logger.error('Error in ModuleService.getModules:', error);
      throw error;
    }
  }

  public async generateModules(request: GenerateModulesRequest) {
    try {
      const prompt = generateModulesPrompt({
        courseId: request.courseId,
        courseName: request.courseName,
        courseDescription: request.courseDescription,
        learningOutcomes: request.learningOutcomes,
        level: request.level,
        duration: request.duration,
        noOfModules: request.noOfModules,
        language: request.language,
        prerequisites: request.prerequisites,
      });

      const result = await geminiCall(prompt, {
        responseSchema: modulesSchema,
        temperature: 0.7,
        maxRetries: 3,
      });

      logger.info('Raw Gemini response:', result);

      if (!result.modules || !Array.isArray(result.modules)) {
        throw new Error('Invalid response from Gemini: missing modules array');
      }

      const createdModules = await this.repository.createModules(
        request.courseId,
        request.courseName,
        result.modules
      );

      logger.info(`Successfully created ${createdModules} modules`);
      return createdModules;
    } catch (error) {
      logger.error('Error in ModuleService.generateModules:', error);
      throw error;
    }
  }

  /**
   * Regenerate module content while preserving IDs and relationships.
   * This updates existing modules in-place without breaking child references.
   */
  public async regenerateModules(request: UpdateModuleRequest) {
    try {
      const existingModules = await this.repository.getModules(
        request.courseId
      );

      if (existingModules.length === 0) {
        throw new AppError(
          'No existing modules found. Use generateModules instead.',
          404
        );
      }

      logger.info(
        `Found ${existingModules.length} existing modules for courseId: ${request.courseId}`
      );

      existingModules.sort((a, b) => a.moduleOrder - b.moduleOrder);

      const enhancedPrompt = this.buildRegenerationPrompt(request);

      const result = await geminiCall(enhancedPrompt, {
        responseSchema: modulesSchema,
        temperature: 0.8,
        maxRetries: 3,
      });

      if (!result.modules || !Array.isArray(result.modules)) {
        throw new Error('Invalid response from Gemini: missing modules array');
      }

      if (result.modules.length !== existingModules.length) {
        logger.warn(
          `AI generated ${result.modules.length} modules but expected ${existingModules.length}. Adjusting...`
        );
      }

      const updatedModules: Module[] = existingModules.map(
        (existing, index) => {
          const newContent = result.modules[index] || result.modules[0];
          return {
            ...existing,
            ...newContent,
            id: existing.id,
            courseId: existing.courseId,
            courseName: existing.courseName,
            moduleOrder: existing.moduleOrder,
            createdAt: existing.createdAt,
          };
        }
      );

      const updateResult = await this.repository.updateModulesBatch(
        updatedModules
      );

      logger.info(
        `Regenerated ${updateResult.updated} modules. Errors: ${updateResult.errors.length}`
      );

      if (updateResult.errors.length > 0) {
        logger.error('Errors during batch update:', updateResult.errors);
      }

      return {
        updated: updateResult.updated,
        errors: updateResult.errors,
        modules: updatedModules,
      };
    } catch (error) {
      logger.error('Error in ModuleService.regenerateModules:', error);
      throw error;
    }
  }

  private buildRegenerationPrompt(request: UpdateModuleRequest): string {
    const basePrompt = generateModulesPrompt({
      courseId: request.courseId,
      courseName: request.courseName,
      courseDescription: request.courseDescription,
      learningOutcomes: request.learningOutcomes,
      level: request.level,
      duration: request.duration,
      noOfModules: request.noOfModules,
      language: request.language,
      prerequisites: request.prerequisites,
    });

    if (request.userInstructions) {
      return `${basePrompt}\n\n**IMPORTANT USER FEEDBACK FOR REGENERATION:**\n${request.userInstructions}\n\nPlease adjust the content based on the above feedback while maintaining the same structure and number of modules.`;
    }

    return `${basePrompt}\n\n**NOTE:** This is a regeneration request. Please provide fresh, alternative content while maintaining educational quality and structure.`;
  }

  public async deleteModulesByCourseId(courseId: string): Promise<void> {
    try {
      await this.repository.deleteModulesByCourseId(courseId);
      logger.info(`Deleted modules for courseId: ${courseId}`);
    } catch (error) {
      logger.error('Error in ModuleService.deleteModulesByCourseId:', error);
      throw error;
    }
  }
}
