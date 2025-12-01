import { Router } from "express";
import type { LessonController } from "./controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { courseOwnershipMiddleware } from "../../middlewares/ownership.middle";

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
     *                       lessonName:
     *                         type: string
     *                       type:
     *                         type: string
     *                         enum: [video, article, quiz]
     *                       duration:
     *                         type: string
     *                         example: "15m"
     *                       lessonDescription:
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
     *                       learningOutcome:
     *                         type: string
     *                       prerequisites:
     *                         type: array
     *                         items:
     *                           type: string
     *                 message:
     *                   type: string
     *                 total:
     *                   type: integer
     *       404:
     *         description: Chapter not found
     *       500:
     *         description: Internal server error
     */
    this.router.get("/:chapterId/lessons", (req, res, next) =>
      this.controller.getLessons(req, res, next),
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
     *               - chapterName
     *               - chapterDescription
     *               - chapterOrder
     *               - learningObjectives
     *               - keyTopics
     *               - estimatedDuration
     *               - estimatedLessonCount
     *               - courseName
     *               - moduleName
     *               - level
     *               - language
     *             properties:
     *               chapterId:
     *                 type: string
     *               chapterName:
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
     *               moduleName:
     *                 type: string
     *               level:
     *                 type: string
     *                 enum: [beginner, intermediate, advanced]
     *               language:
     *                 type: string
     *     responses:
     *       201:
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
     *                       lessonName:
     *                         type: string
     *                       type:
     *                         type: string
     *                         enum: [video, article, quiz]
     *                       duration:
     *                         type: string
     *                       lessonDescription:
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
     *                       learningOutcome:
     *                         type: string
     *                       prerequisites:
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
    this.router.post(
      "/lessons",
      // authMiddleware,
      // courseOwnershipMiddleware,
      (req, res, next) => this.controller.generateLessons(req, res, next),
    );

    /**
     * @openapi
     * /lessons/{lessonId}:
     *   get:
     *     tags:
     *       - Lessons
     *     summary: Get a single lesson by ID
     *     description: Retrieves detailed information about a specific lesson
     *     parameters:
     *       - in: path
     *         name: lessonId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the lesson to retrieve
     *     responses:
     *       200:
     *         description: Lesson retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                     chapterId:
     *                       type: string
     *                     lessonOrder:
     *                       type: integer
     *                     lessonName:
     *                       type: string
     *                     type:
     *                       type: string
     *                       enum: [video, article, quiz]
     *                     duration:
     *                       type: string
     *                     lessonDescription:
     *                       type: string
     *                     content:
     *                       type: string
     *                       nullable: true
     *                     videoSearchQuery:
     *                       type: string
     *                       nullable: true
     *                     resources:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           title:
     *                             type: string
     *                           url:
     *                             type: string
     *                           type:
     *                             type: string
     *                             enum: [documentation, article, tool, github, reference]
     *                           description:
     *                             type: string
     *                     learningOutcome:
     *                       type: string
     *                     prerequisites:
     *                       type: array
     *                       items:
     *                         type: string
     *                 message:
     *                   type: string
     *       404:
     *         description: Lesson not found
     *       500:
     *         description: Internal server error
     */
    this.router.get("/lessons/:lessonId", (req, res, next) =>
      this.controller.getLessonById(req, res, next),
    );

    /**
     * @openapi
     * /lessons/{lessonId}:
     *   patch:
     *     tags:
     *       - Lessons
     *     summary: Update a lesson
     *     description: Updates specific fields of an existing lesson
     *     parameters:
     *       - in: path
     *         name: lessonId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the lesson to update
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               lessonOrder:
     *                 type: integer
     *               lessonName:
     *                 type: string
     *               type:
     *                 type: string
     *                 enum: [video, article, quiz]
     *               duration:
     *                 type: string
     *               lessonDescription:
     *                 type: string
     *               content:
     *                 type: string
     *                 nullable: true
     *               videoSearchQuery:
     *                 type: string
     *                 nullable: true
     *               resources:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     title:
     *                       type: string
     *                     url:
     *                       type: string
     *                     type:
     *                       type: string
     *                       enum: [documentation, article, tool, github, reference]
     *                     description:
     *                       type: string
     *               learningOutcome:
     *                 type: string
     *               prerequisites:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       200:
     *         description: Lesson updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                     chapterId:
     *                       type: string
     *                     lessonOrder:
     *                       type: integer
     *                     lessonName:
     *                       type: string
     *                     type:
     *                       type: string
     *                       enum: [video, article, quiz]
     *                     duration:
     *                       type: string
     *                     lessonDescription:
     *                       type: string
     *                     content:
     *                       type: string
     *                       nullable: true
     *                     videoSearchQuery:
     *                       type: string
     *                       nullable: true
     *                     resources:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           title:
     *                             type: string
     *                           url:
     *                             type: string
     *                           type:
     *                             type: string
     *                             enum: [documentation, article, tool, github, reference]
     *                           description:
     *                             type: string
     *                     learningOutcome:
     *                       type: string
     *                     prerequisites:
     *                       type: array
     *                       items:
     *                         type: string
     *                 message:
     *                   type: string
     *       404:
     *         description: Lesson not found
     *       400:
     *         description: Invalid request body
     *       500:
     *         description: Internal server error
     */
    this.router.patch(
      "/lessons/:lessonId",
      authMiddleware,
      courseOwnershipMiddleware,
      (req, res, next) => this.controller.updateLesson(req, res, next),
    );

    /**
     * @openapi
     * /lessons/{lessonId}:
     *   delete:
     *     tags:
     *       - Lessons
     *     summary: Delete a lesson
     *     description: Permanently deletes a lesson from the system
     *     parameters:
     *       - in: path
     *         name: lessonId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the lesson to delete
     *     responses:
     *       200:
     *         description: Lesson deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
     *         description: Lesson not found
     *       500:
     *         description: Internal server error
     */
    this.router.delete(
      "/lessons/:lessonId",
      // authMiddleware,
      // courseOwnershipMiddleware,
      (req, res, next) => this.controller.deleteLesson(req, res, next),
    );

    /**
     * @openapi
     * /lessons/{lessonId}/videos:
     *   get:
     *     tags:
     *       - Lessons
     *     summary: Get YouTube videos for a video lesson
     *     description: Searches YouTube for videos based on the lesson's videoSearchQuery
     *     parameters:
     *       - in: path
     *         name: lessonId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the lesson
     *       - in: query
     *         name: maxResults
     *         schema:
     *           type: integer
     *           default: 5
     *         description: Maximum number of videos to return
     *     responses:
     *       200:
     *         description: YouTube videos retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 videos:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       videoId:
     *                         type: string
     *                       title:
     *                         type: string
     *                       description:
     *                         type: string
     *                       thumbnailUrl:
     *                         type: string
     *                       channelTitle:
     *                         type: string
     *                       publishedAt:
     *                         type: string
     *                       duration:
     *                         type: string
     *                       viewCount:
     *                         type: string
     *                 totalResults:
     *                   type: integer
     *       400:
     *         description: Lesson does not have video search query
     *       404:
     *         description: Lesson not found
     *       500:
     *         description: Internal server error
     */
    this.router.get("/lessons/:lessonId/videos", (req, res, next) =>
      this.controller.getLessonVideos(req, res, next),
    );

    /**
     * @openapi
     * /lessons/{lessonId}/transcript:
     *   post:
     *     tags:
     *       - Lessons
     *     summary: Fetch and store YouTube transcript for a video lesson
     *     description: Fetches the transcript from YouTube and stores it in the lesson
     *     parameters:
     *       - in: path
     *         name: lessonId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the lesson
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - videoId
     *             properties:
     *               videoId:
     *                 type: string
     *                 description: YouTube video ID
     *               language:
     *                 type: string
     *                 description: Preferred language code (default 'en')
     *                 default: en
     *     responses:
     *       200:
     *         description: Transcript fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 transcript:
     *                   type: string
     *                 language:
     *                   type: string
     *                 stats:
     *                   type: object
     *                   properties:
     *                     wordCount:
     *                       type: integer
     *                     duration:
     *                       type: integer
     *                     segmentCount:
     *                       type: integer
     *                     averageWordsPerMinute:
     *                       type: integer
     *       400:
     *         description: Invalid request or not a video lesson
     *       404:
     *         description: Lesson not found or transcript not available
     *       500:
     *         description: Internal server error
     */
    this.router.post(
      "/lessons/:lessonId/transcript",
      // authMiddleware,
      (req, res, next) => this.controller.fetchTranscript(req, res, next),
    );

    /**
     * @openapi
     * /lessons/{lessonId}/transcript:
     *   get:
     *     tags:
     *       - Lessons
     *     summary: Get stored transcript for a video lesson
     *     description: Returns the stored transcript if available
     *     parameters:
     *       - in: path
     *         name: lessonId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the lesson
     *       - in: query
     *         name: withTimestamps
     *         schema:
     *           type: boolean
     *         description: Include timestamps in the transcript
     *     responses:
     *       200:
     *         description: Transcript retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 transcript:
     *                   type: string
     *                 language:
     *                   type: string
     *                 fetchedAt:
     *                   type: string
     *       404:
     *         description: Lesson not found or transcript not available
     *       500:
     *         description: Internal server error
     */
    this.router.get("/lessons/:lessonId/transcript", (req, res, next) =>
      this.controller.getTranscript(req, res, next),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
