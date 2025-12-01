import { AppError } from "../../utils/errors";
import { geminiCall } from "../../utils/geminiCall";
import { logger } from "../../utils/loggers";
import {
  buildModulesPrompt,
  type ModulePromptMode,
} from "../../utils/prompts/module-temp";
import type { ModuleRepository } from "./repository";
import {
  modulesSchema,
  type GenerateModulesRequest,
  type Module,
  type UpdateModuleRequest,
} from "./types";

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
      logger.error("Error in ModuleService.getModules:", error);
      throw error;
    }
  }

  public async getModule(moduleId: string) {
    try {
      const module = await this.repository.getModule(moduleId);
      return module;
    } catch (error) {
      logger.error("Error in ModuleService.getModule:", error);
      throw error;
    }
  }

  public async generateModules(request: GenerateModulesRequest) {
    try {
      const promptMode: ModulePromptMode = request.promptMode ?? "system";
      const { userPrompt, systemPrompt } = buildModulesPrompt(
        {
          courseId: request.courseId,
          courseName: request.courseName,
          courseDescription: request.courseDescription,
          learningOutcomes: request.learningOutcomes,
          level: request.level,
          duration: request.duration,
          noOfModules: request.noOfModules,
          language: request.language,
          prerequisites: request.prerequisites,
          userInstructions: request.userInstructions,
        },
        { mode: promptMode, intent: "generate" },
      );

      const result = await geminiCall(userPrompt, {
        responseSchema: modulesSchema,
        temperature: 0.7,
        maxRetries: 3,
        systemPrompt,
        benchmarkTag: `modules:${promptMode}`,
        metadata: {
          courseId: request.courseId,
          level: request.level,
        },
      });

      logger.info("Modules generated via Gemini", {
        courseId: request.courseId,
        mode: promptMode,
        moduleCount: result?.modules?.length ?? 0,
      });

      if (!result.modules || !Array.isArray(result.modules)) {
        throw new Error("Invalid response from Gemini: missing modules array");
      }

      const createdModules = await this.repository.createModules(
        request.courseId,
        request.courseName,
        request.level,
        request.language,
        result.modules,
      );

      logger.info(`Successfully created ${createdModules} modules`);
      return createdModules;
    } catch (error) {
      logger.error("Error in ModuleService.generateModules:", error);
      throw error;
    }
  }

  public async regenerateModules(request: UpdateModuleRequest) {
    try {
      const existingModules = await this.repository.getModules(
        request.courseId,
      );

      if (existingModules.length === 0) {
        throw new AppError(
          "No existing modules found. Use generateModules instead.",
          404,
        );
      }

      logger.info(
        `Found ${existingModules.length} existing modules for courseId: ${request.courseId}`,
      );

      existingModules.sort((a, b) => a.moduleOrder - b.moduleOrder);

      const promptMode: ModulePromptMode = request.promptMode ?? "system";
      const fallbackLearningOutcomes =
        request.learningOutcomes && request.learningOutcomes.length > 0
          ? request.learningOutcomes
          : existingModules
              .flatMap((module) => module.learningObjectives.slice(0, 1))
              .slice(0, 5);

      const { userPrompt, systemPrompt } = buildModulesPrompt(
        {
          courseId: request.courseId,
          courseName:
            request.courseName ||
            existingModules[0]?.courseName ||
            "Untitled Course",
          courseDescription:
            request.courseDescription ||
            "Refresh the existing module blueprint with improved clarity.",
          learningOutcomes:
            fallbackLearningOutcomes.length > 0
              ? fallbackLearningOutcomes
              : ["Deliver structured, outcome-focused modules."],
          level: request.level || existingModules[0]?.level || "intermediate",
          duration:
            request.duration ||
            existingModules[0]?.estimatedDuration ||
            "Match previous pacing",
          noOfModules: request.noOfModules || existingModules.length,
          language:
            request.language || existingModules[0]?.language || "English",
          prerequisites: request.prerequisites || "",
          userInstructions: request.userInstructions,
        },
        { mode: promptMode, intent: "regenerate" },
      );

      const result = await geminiCall(userPrompt, {
        responseSchema: modulesSchema,
        temperature: 0.8,
        maxRetries: 3,
        systemPrompt,
        benchmarkTag: `modules:${promptMode}`,
        metadata: {
          courseId: request.courseId,
          intent: "regenerate",
          mode: promptMode,
        },
      });

      if (!result.modules || !Array.isArray(result.modules)) {
        throw new Error("Invalid response from Gemini: missing modules array");
      }

      if (result.modules.length !== existingModules.length) {
        logger.warn(
          `AI generated ${result.modules.length} modules but expected ${existingModules.length}. Adjusting...`,
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
            level: existing.level,
            language: existing.language,
            moduleOrder: existing.moduleOrder,
            createdAt: existing.createdAt,
          };
        },
      );

      const updateResult =
        await this.repository.updateModulesBatch(updatedModules);

      logger.info(
        `Regenerated ${updateResult.updated} modules. Errors: ${updateResult.errors.length}`,
      );

      if (updateResult.errors.length > 0) {
        logger.error("Errors during batch update:", updateResult.errors);
      }

      return {
        updated: updateResult.updated,
        errors: updateResult.errors,
        modules: updatedModules,
      };
    } catch (error) {
      logger.error("Error in ModuleService.regenerateModules:", error);
      throw error;
    }
  }

  public async deleteModulesByCourseId(courseId: string): Promise<void> {
    try {
      await this.repository.deleteModulesByCourseId(courseId);
      logger.info(`Deleted modules for courseId: ${courseId}`);
    } catch (error) {
      logger.error("Error in ModuleService.deleteModulesByCourseId:", error);
      throw error;
    }
  }
}
