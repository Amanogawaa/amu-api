import { logger } from '../../utils/loggers';
import type { ModuleService } from './service';
import type { NextFunction, Request, Response } from 'express';

export class ModuleController {
  private service: ModuleService;

  constructor(service: ModuleService) {
    this.service = service;
  }

  async getModules(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { courseId } = request.params;
      if (!courseId) {
        response.status(400).json({
          message: 'Course ID is required',
        });
        return;
      }

      const modules = await this.service.getModules(courseId!);

      response.status(200).send(modules);
    } catch (error) {
      logger.error('Error in ModuleController.getModules:', error);
      next(error);
    }
  }

  async generateModules(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const moduleRequest = request.body;
      const createdModules = await this.service.generateModules(moduleRequest);

      response.status(201).json({
        data: createdModules,
        message: 'Modules generated successfully',
      });
    } catch (error) {
      logger.error('Error in ModuleController.generateModules:', error);
      next(error);
    }
  }

  async regenerateModules(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { courseId } = request.params;

      if (!courseId) {
        response.status(400).json({
          message: 'Course ID is required',
        });
        return;
      }

      const regenerationRequest = {
        ...request.body,
        courseId,
      };

      const result = await this.service.regenerateModules(regenerationRequest);

      response.status(200).json({
        data: result.modules,
        message: `Successfully regenerated ${result.updated} modules`,
        updated: result.updated,
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
    } catch (error) {
      logger.error('Error in ModuleController.regenerateModules:', error);
      next(error);
    }
  }

  async deleteModulesByCourseId(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { courseId } = request.params;

      if (!courseId) {
        response.status(400).json({
          message: 'Course ID is required',
        });
        return;
      }

      await this.service.deleteModulesByCourseId(courseId);

      response.status(200).json({
        message: `Modules for courseId ${courseId} deleted successfully`,
      });
    } catch (error) {
      logger.error('Error in ModuleController.deleteModulesByCourseId:', error);
      next(error);
    }
  }
}
