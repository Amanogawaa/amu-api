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
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                       courseId:
     *                         type: string
     *                       chapterOrder:
     *                         type: integer
     *                       title:
     *                         type: string
     *                       description:
     *                         type: string
     *                       estimatedDuration:
     *                         type: string
     *                         example: "1h 30m"
     *                       learningObjectives:
     *                         type: array
     *                         items:
     *                           type: string
     *                       keyTopics:
     *                         type: array
     *                         items:
     *                           type: string
     *                       estimatedLessonCount:
     *                         type: integer
     *                       createdAt:
     *                         type: string
     *                         format: date-time
     *                       updatedAt:
     *                         type: string
     *                         format: date-time
     *                 message:
     *                   type: string
     *                 total:
     *                   type: integer
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
     *     description: Generates chapter outlines based on course details using AI
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - courseId
     *               - courseName
     *               - description
     *               - learningOutcomes
     *               - duration
     *               - noOfChapters
     *               - level
     *               - language
     *             properties:
     *               courseId:
     *                 type: string
     *                 description: The ID of the course
     *               courseName:
     *                 type: string
     *                 description: The name of the course
     *               description:
     *                 type: string
     *                 description: Detailed course description
     *               learningOutcomes:
     *                 type: array
     *                 items:
     *                   type: string
     *                 description: Array of learning outcomes for the course
     *               duration:
     *                 type: string
     *                 description: Total course duration (e.g., "6 hours")
     *               noOfChapters:
     *                 type: string
     *                 description: Number of chapters to generate
     *               level:
     *                 type: string
     *                 enum: [beginner, intermediate, advanced]
     *                 description: Course difficulty level
     *               language:
     *                 type: string
     *                 description: Language of the course content
     *               prerequisites:
     *                 type: string
     *                 description: Prerequisites for the course (optional)
     *     responses:
     *       200:
     *         description: Chapters generated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                       courseId:
     *                         type: string
     *                       chapterOrder:
     *                         type: integer
     *                       title:
     *                         type: string
     *                       description:
     *                         type: string
     *                       estimatedDuration:
     *                         type: string
     *                         example: "1h 30m"
     *                       learningObjectives:
     *                         type: array
     *                         items:
     *                           type: string
     *                       keyTopics:
     *                         type: array
     *                         items:
     *                           type: string
     *                       estimatedLessonCount:
     *                         type: integer
     *                 message:
     *                   type: string
     *       400:
     *         description: Invalid request body
     *       500:
     *         description: Internal server error
     */
    this.router.post('/chapter', (req, res, next) =>
      this.controller.generateChapter(req, res, next)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
