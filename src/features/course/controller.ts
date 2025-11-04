import {
  type Request,
  type Response,
  type NextFunction,
  response,
} from 'express';
import { logger } from '../../utils/loggers';
import type { CourseService } from './service';
import type { CourseQueryParams } from './types';
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class CourseController {
  private service: CourseService;

  constructor(service: CourseService) {
    this.service = service;
  }

  async getCourses(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queryParams: CourseQueryParams = {
        level: request.query.level as any,
        uid: request.user?.uid as string,
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

      const total = courses.length;
      const limit = queryParams.limit || 10;
      const offset = queryParams.offset || 0;

      response.status(200).send({
        results: courses,
        count: total,
        next: offset + limit < total ? offset + limit : null,
        previous: offset > 0 ? Math.max(0, offset - limit) : null,
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

      response.status(200).send(course);
    } catch (error) {
      logger.error('Error in CourseController.getCourseById:', error);
      next(error);
    }
  }

  async generateCourse(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const courseRequest = {
        ...request.body,
        uid: request.user?.uid,
      };
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

  async validateCourseCompleteness(
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

      const validation = await this.service.validateCourseCompleteness(id);

      response.status(200).json({
        data: validation,
        message: validation.isComplete
          ? 'Course is complete and ready to publish'
          : 'Course is incomplete',
      });
    } catch (error) {
      logger.error(
        'Error in CourseController.validateCourseCompleteness:',
        error
      );
      next(error);
    }
  }

  async publishCourse(
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

      const course = await this.service.publishCourse(id);

      response.status(200).json({
        data: course,
        message: 'Course published successfully',
      });
    } catch (error) {
      logger.error('Error in CourseController.publishCourse:', error);
      next(error);
    }
  }

  async unpublishCourse(
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

      const course = await this.service.unpublishCourse(id);

      response.status(200).json({
        data: course,
        message: 'Course unpublished successfully',
      });
    } catch (error) {
      logger.error('Error in CourseController.unpublishCourse:', error);
      next(error);
    }
  }
}
