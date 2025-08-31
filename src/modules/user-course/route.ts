import { Router } from 'express';
import { UserCourseController } from './controller';
import { authMiddleware } from '../../core/middlewares/auth';

export class UserCourseRoute {
  public router: Router;
  private controller: UserCourseController;

  constructor(controller: UserCourseController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /user-courses/enroll:
     *   post:
     *     tags: [User Courses]
     *     summary: Enroll in a course
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               courseId: { type: string }
     *     responses:
     *       201:
     *         description: Enrolled successfully
     *       409:
     *         description: Already enrolled
     */
    this.router.post(
      '/user-courses/enroll',
      authMiddleware,
      this.controller.enroll.bind(this.controller)
    );

    /**
     * @openapi
     * /user-courses/mark-lesson:
     *   post:
     *     tags: [User Courses]
     *     summary: Mark lesson as completed
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               lessonId: { type: string }
     *               score: { type: integer, minimum: 0, maximum: 100 }
     *     responses:
     *       200:
     *         description: Lesson marked completed
     */
    this.router.post(
      '/user-courses/mark-lesson',
      authMiddleware,
      this.controller.markLessonCompleted.bind(this.controller)
    );

    /**
     * @openapi
     * /user-courses/{courseId}/progress:
     *   get:
     *     tags: [User Courses]
     *     summary: Get course progress
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: Course progress
     */
    this.router.get(
      '/user-courses/:courseId/progress',
      authMiddleware,
      this.controller.getProgress.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
