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
}
