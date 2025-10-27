import {
  type Request,
  type Response,
  type NextFunction,
  response,
} from 'express';
import { logger } from '../../utils/loggers';
import type { CourseService } from './service';
import type { CourseQueryParams } from './types';

export class CourseController {
  private service: CourseService;

  constructor(service: CourseService) {
    this.service = service;
  }

  async getCourses(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queryParams: CourseQueryParams = {
        level: request.query.level as any,
        category: request.query.category as string,
        language: request.query.language as string,
        limit: request.query.limit
          ? parseInt(request.query.limit as string)
          : undefined,
        offset: request.query.offset
          ? parseInt(request.query.offset as string)
          : undefined,
      };

      const courses = await this.service.getCourses(queryParams);

      response.status(200).json({
        data: courses,
        message: 'Courses retrieved successfully',
        total: courses.length,
      });
    } catch (error) {
      logger.error('Error in CourseController.getCourses:', error);
      next(error);
    }
  }

  async getCourseById(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = request.params;

      if (!id) {
        response.status(400).json({
          message: 'Course ID is required',
        });
        return;
      }

      const course = await this.service.getCourseById(id!);

      response.status(200).json({
        data: course,
        message: 'Course retrieved successfully',
      });
    } catch (error) {
      logger.error('Error in CourseController.getCourseById:', error);
      next(error);
    }
  }

  async generateCourse(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const courseRequest = request.body;
      console.log('Received course generation request:', courseRequest);
      const course = await this.service.generateCourse(courseRequest);

      response.status(201).json({
        data: course,
        message: 'Course generated successfully',
      });
    } catch (error) {
      logger.error('Error in CoursesController.generateCourse:', error);
      next(error);
    }
  }

  async deleteCourse(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = request.params;

      if (!id) {
        response.status(400).json({
          message: 'Course ID is required',
        });
        return;
      }

      await this.service.deleteCourse(id!);

      response.status(204).send();
    } catch (error) {
      logger.error('Error in CoursesController.deleteCourse:', error);
      next(error);
    }
  }
}
