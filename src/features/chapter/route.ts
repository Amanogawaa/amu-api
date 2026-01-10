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
     * /{moduleId}/chapter:
     *   get:
     *     tags:
     *       - Chapters
     *     summary: Retrieve chapters for a specific module
     *     description: Returns chapter details for the given module ID
     *     parameters:
     *       - in: path
     *         name: moduleId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the module to retrieve chapters for
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
     *                       moduleId:
     *                         type: string
     *                       chapterOrder:
     *                         type: integer
     *                       courseName:
     *                         type: string
     *                       moduleName:
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
    this.router.get("/:moduleId/chapter", (req, res, next) =>
      this.controller.getChapters(req, res, next),
    );

    this.router.get("/chapter/:chapterId", (req, res, next) =>
      this.controller.getChapter(req, res, next),
    );

    /**
     * @openapi
     * /chapter:
     *   post:
     *     tags:
     *       - Chapters
     *     summary: Generate chapters for a module
     *     description: Generates chapter outlines based on module details using AI
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - moduleId
     *               - moduleName
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
     *               moduleId:
     *                 type: string
     *                 description: The ID of the module
     *               moduleName:
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
     *                       moduleId:
     *                         type: string
     *                       chapterOrder:
     *                         type: integer
     *                       courseName:
     *                         type: string
     *                       moduleName:
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
      "/chapter",
      // authMiddleware,
      // courseOwnershipMiddleware,
      (req, res, next) => this.controller.generateChapter(req, res, next),
    );

    /**
     * @openapi
     * /{moduleId}/chapter:
     *   delete:
     *     tags:
     *       - Chapters
     *     summary: Delete chapters by module ID
     *     description: Deletes all chapters associated with the specified module ID
     *     parameters:
     *       - in: path
     *         name: moduleId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the module whose chapters are to be deleted
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
      "/:moduleId/chapter",
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
