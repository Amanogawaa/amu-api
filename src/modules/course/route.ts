import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/auth';
import type { CourseController } from './controller';

export class CourseRoute {
  public router: Router;
  private controller: CourseController;

  constructor(controller: CourseController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /courses:
     *   get:
     *     tags: [Courses]
     *     summary: List courses or fetch one by id
     *     parameters:
     *       - in: query
     *         name: id
     *         schema: { type: string }
     *         description: When provided, returns a single course
     *       - in: query
     *         name: limit
     *         schema: { type: integer, default: 10, minimum: 1 }
     *       - in: query
     *         name: offset
     *         schema: { type: integer, default: 0, minimum: 0 }
     *     responses:
     *       200:
     *         description: Courses or a single course
     */
    this.router.get(
      '/courses',
      this.controller.getCourses.bind(this.controller)
    );

    /**
     * @openapi
     * /courses:
     *   post:
     *     tags: [Courses]
     *     summary: Generate and create a course
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/GenerateCourseRequest'
     *     responses:
     *       201:
     *         description: Course created
     */
    this.router.post(
      '/courses',
      authMiddleware,
      this.controller.generateCourse.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
