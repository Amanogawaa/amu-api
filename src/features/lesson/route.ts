import { Router } from 'express';
import type { LessonController } from './controller';

export class LessonRoute {
  public router: Router;
  private controller: LessonController;

  constructor(lessonController: LessonController) {
    this.controller = lessonController;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /{chapterId}/lessons:
     *   get:
     *     tags:
     *       - Lessons
     *     summary: Retrieve lessons for a specific chapter
     *     description: Returns lesson details for the given chapter ID
     *     parameters:
     *       - in: path
     *         name: chapterId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the chapter to retrieve lessons for
     *     responses:
     *       200:
     *         description: Lessons retrieved successfully
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
     *                       chapterId:
     *                         type: string
     *                       lessonOrder:
     *                         type: integer
     *                       title:
     *                         type: string
     *                       type:
     *                         type: string
     *                         enum: [video, article, quiz]
     *                       duration:
     *                         type: string
     *                         example: "15m"
     *                       description:
     *                         type: string
     *                       content:
     *                         type: string
     *                         nullable: true
     *                       videoSearchQuery:
     *                         type: string
     *                         nullable: true
     *                       resources:
     *                         type: array
     *                         items:
     *                           type: object
     *                           properties:
     *                             title:
     *                               type: string
     *                             url:
     *                               type: string
     *                             type:
     *                               type: string
     *                               enum: [documentation, article, tool, github, reference]
     *                             description:
     *                               type: string
     *                       prerequisiteKnowledge:
     *                         type: array
     *                         items:
     *                           type: string
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
     *         description: Chapter not found
     *       500:
     *         description: Internal server error
     */
    this.router.get('/:chapterId/lessons', (req, res, next) =>
      this.controller.getLessons(req, res, next)
    );

    /**
     * @openapi
     * /lessons:
     *   post:
     *     tags:
     *       - Lessons
     *     summary: Generate lessons for a chapter using AI
     *     description: Generates a set of lessons for a chapter based on chapter context and learning objectives
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - chapterId
     *               - chapterTitle
     *               - chapterDescription
     *               - chapterOrder
     *               - learningObjectives
     *               - keyTopics
     *               - estimatedDuration
     *               - estimatedLessonCount
     *               - courseName
     *               - level
     *               - language
     *             properties:
     *               chapterId:
     *                 type: string
     *               chapterTitle:
     *                 type: string
     *               chapterDescription:
     *                 type: string
     *               chapterOrder:
     *                 type: integer
     *               learningObjectives:
     *                 type: array
     *                 items:
     *                   type: string
     *               keyTopics:
     *                 type: array
     *                 items:
     *                   type: string
     *               estimatedDuration:
     *                 type: string
     *                 description: Estimated chapter duration (e.g., "1h 30m")
     *               estimatedLessonCount:
     *                 type: integer
     *               courseName:
     *                 type: string
     *               level:
     *                 type: string
     *                 enum: [beginner, intermediate, advanced]
     *               language:
     *                 type: string
     *     responses:
     *       200:
     *         description: Lessons generated successfully
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
     *                       lessonOrder:
     *                         type: integer
     *                       title:
     *                         type: string
     *                       type:
     *                         type: string
     *                         enum: [video, article, quiz]
     *                       duration:
     *                         type: string
     *                       description:
     *                         type: string
     *                       content:
     *                         type: string
     *                         nullable: true
     *                       videoSearchQuery:
     *                         type: string
     *                         nullable: true
     *                       resources:
     *                         type: array
     *                         items:
     *                           type: object
     *                           properties:
     *                             title:
     *                               type: string
     *                             url:
     *                               type: string
     *                             type:
     *                               type: string
     *                               enum: [documentation, article, tool, github, reference]
     *                             description:
     *                               type: string
     *                       prerequisiteKnowledge:
     *                         type: array
     *                         items:
     *                           type: string
     *                 message:
     *                   type: string
     *       400:
     *         description: Invalid request body
     *       500:
     *         description: Internal server error
     */
    this.router.post('/lessons', (req, res, next) =>
      this.controller.generateLessons(req, res, next)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
