import { Router } from 'express';
import type { ChapterController } from './controller';

export class ChapterRoute {
  public router: Router;
  private controller: ChapterController;

  constructor(chapterController: ChapterController) {
    this.controller = chapterController;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /{courseId}/chapters:
     *   get:
     *     tags:
     *       - Chapters
     *     summary: Retrieve chapters for a specific course
     *     description: Returns chapter details for the given course ID
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the course to retrieve chapters for
     *     responses:
     *       200:
     *         description: Chapter details retrieved successfully
     *       404:
     *         description: Course not found
     *       500:
     *         description: Internal server error
     */
    this.router.get('/:courseId/chapters', (req, res, next) =>
      this.controller.getChapters(req, res, next)
    );

    /**
     * @openapi
     * /chapter:
     *   post:
     *     tags:
     *       - Chapters
     *     summary: Generate chapters for a course
     *     description: Generates chapter outlines based on course details
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               courseId:
     *                 type: string
     *               title:
     *                 type: string
     *               description:
     *                 type: string
     *               noOfChapters:
     *                 type: integer
     *               duration:
     *                 type: integer
     *               level:
     *                 type: string
     *               language:
     *                 type: string
     *               learningOutcomes:
     *                 type: array
     *                 items:
     *                   type: string
     */
    this.router.post('/chapter', (req, res, next) =>
      this.controller.generateChapter(req, res, next)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
