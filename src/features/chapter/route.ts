import { Router } from "express";
import type { ChapterController } from "./controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { courseOwnershipMiddleware } from "../../middlewares/ownership.middle";

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
     *                       courseName:
     *                         type: string
     *                       courseName:
     *                         type: string
     *                       chapterName:
     *                         type: string
     *                       chapterDescription:
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
    this.router.get("/:courseId/chapters", (req, res, next) =>
      this.controller.getChapters(req, res, next),
    );

    this.router.get("/chapter/:chapterId", (req, res, next) =>
      this.controller.getChapter(req, res, next),
    );

    /**
     * @openapi
     * /chapters:
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
     *               - moduleDescription
     *               - moduleLearningObjectives
     *               - moduleKeySkills
     *               - estimatedDuration
     *               - estimatedChapterCount
     *               - courseName
     *               - level
     *               - language
     *               - moduleOrder
     *             properties:
     *               courseId:
     *                 type: string
     *                 description: The ID of the module
     *               courseName:
     *                 type: string
     *                 description: The name of the module
     *               moduleDescription:
     *                 type: string
     *                 description: Detailed module description
     *               moduleLearningObjectives:
     *                 type: array
     *                 items:
     *                   type: string
     *                 description: Array of learning objectives for the module
     *               moduleKeySkills:
     *                 type: array
     *                 items:
     *                   type: string
     *                 description: Array of key skills taught in the module
     *               estimatedDuration:
     *                 type: string
     *                 description: Total module duration (e.g., "6 hours")
     *               estimatedChapterCount:
     *                 type: integer
     *                 description: Number of chapters to generate
     *               courseName:
     *                 type: string
     *                 description: The name of the parent course
     *               level:
     *                 type: string
     *                 enum: [beginner, intermediate, advanced]
     *                 description: Course difficulty level
     *               language:
     *                 type: string
     *                 description: Language of the module content
     *               moduleOrder:
     *                 type: integer
     *                 description: The order of this module within the course
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
     *                       courseName:
     *                         type: string
     *                       courseName:
     *                         type: string
     *                       chapterName:
     *                         type: string
     *                       chapterDescription:
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
    this.router.post(
      "/chapters",
      // authMiddleware,
      // courseOwnershipMiddleware,
      (req, res, next) => this.controller.generateChapter(req, res, next),
    );

    /**
     * @openapi
     * /{courseId}/chapters:
     *   delete:
     *     tags:
     *       - Chapters
     *     summary: Delete chapters by course ID
     *     description: Deletes all chapters associated with the specified course ID
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the course whose chapters are to be deleted
     *     responses:
     *       200:
     *         description: Chapters deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       400:
     *         description: Module ID is required
     *       500:
     *         description: Internal server error
     */
    this.router.delete(
      "/:courseId/chapters",
      authMiddleware,
      courseOwnershipMiddleware,
      (req, res, next) =>
        this.controller.deleteChaptersByCourseId(req, res, next),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
