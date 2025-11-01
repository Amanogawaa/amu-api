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
}
