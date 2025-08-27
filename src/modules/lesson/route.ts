import { Router, type Request, type Response } from 'express';
import type { LessonController } from './controller';
import swaggerJSDoc from 'swagger-jsdoc';
import { authMiddleware } from '../../core/middlewares/auth';

export class LessonRoute {
  public router: Router;
  private controller: LessonController;

  constructor(controller: LessonController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /lessons/generate:
     *   post:
     *     tags: [Lessons]
     *     summary: Generate lessons for a chapter
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/GenerateLessonsRequest'
     *     responses:
     *       201:
     *         description: Lessons generated and stored
     *       400:
     *         description: Invalid request
     */
    this.router.post(
      '/lessons/generate',
      this.controller.generateLessons.bind(this.controller)
    );

    /**
     * @openapi
     * /lessons/chapter/{chapterId}:
     *   get:
     *     tags: [Lessons]
     *     summary: Get lessons by chapter
     *     parameters:
     *       - in: path
     *         name: chapterId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: List of lessons
     */
    this.router.get(
      '/lessons/chapter/:chapterId',
      this.controller.getLessonsByChapter.bind(this.controller)
    );

    /**
     * @openapi
     * /lessons/{id}:
     *   get:
     *     tags: [Lessons]
     *     summary: Get a lesson by id
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Lesson
     */
    this.router.get(
      '/lessons/:id',
      this.controller.getLessonById.bind(this.controller)
    );

    /**
     * @openapi
     * /lessons/{id}/resources:
     *   get:
     *     tags: [Lessons]
     *     summary: Get resources for a lesson
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Lesson resources
     */
    this.router.get(
      '/lessons/:id/resources',
      this.controller.getLessonResources.bind(this.controller)
    );

    /**
     * @openapi
     * /lessons/{lessonId}/submit:
     *   post:
     *     tags: [Lessons]
     *     summary: Submit quiz answers for a lesson
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lessonId
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               answers:
     *                 type: object
     *                 additionalProperties: { type: string }
     *     responses:
     *       200:
     *         description: Quiz submitted with score
     */
    this.router.post(
      '/lessons/:lessonId/submit',
      authMiddleware,
      this.controller.submitQuiz.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
