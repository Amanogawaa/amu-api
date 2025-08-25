import { Router } from 'express';
import { ChapterController } from './controller';

export class ChapterRoute {
  public router: Router;
  private controller: ChapterController;

  constructor(controller: ChapterController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /chapters/generate:
     *   post:
     *     tags: [Chapters]
     *     summary: Generate and create chapters for a course
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/GenerateChaptersRequest'
     *     responses:
     *       201:
     *         description: Chapters created
     */
    this.router.post(
      '/chapters/generate',
      this.controller.generateChapters.bind(this.controller)
    );

    /**
     * @openapi
     * /chapters/course/{courseId}:
     *   get:
     *     tags: [Chapters]
     *     summary: Get chapters by course id
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: List of chapters
     */
    // GET /chapters/course/:courseId - Get chapters by course ID
    this.router.get(
      '/chapters/course/:courseId',
      this.controller.getChaptersByCourse.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
