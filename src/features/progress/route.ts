import { Router } from "express";
import type { ProgressController } from "./controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

export class ProgressRoute {
  public router: Router;
  private controller: ProgressController;

  constructor(progressController: ProgressController) {
    this.controller = progressController;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /progress:
     *   post:
     *     tags:
     *       - Progress
     *     summary: Mark a lesson as complete or incomplete
     *     description: Updates user's progress for a specific lesson in a course
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - courseId
     *               - lessonId
     *               - completed
     *             properties:
     *               courseId:
     *                 type: string
     *                 description: The ID of the course
     *               lessonId:
     *                 type: string
     *                 description: The ID of the lesson
     *               completed:
     *                 type: boolean
     *                 description: True to mark complete, false to unmark
     *     responses:
     *       200:
     *         description: Progress updated successfully
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
     *                     courseId:
     *                       type: string
     *                     userId:
     *                       type: string
     *                     lessonsCompleted:
     *                       type: array
     *                       items:
     *                         type: string
     *                     totalLessons:
     *                       type: integer
     *                     percentComplete:
     *                       type: integer
     *                     lastActivityAt:
     *                       type: string
     *                       format: date-time
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized
     */
    this.router.post(
      "/progress",
      authMiddleware,
      this.controller.markLessonProgress.bind(this.controller),
    );

    /**
     * @openapi
     * /progress/summary:
     *   get:
     *     tags:
     *       - Progress
     *     summary: Get user's overall progress summary
     *     description: Returns aggregated progress statistics across all enrolled courses
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Progress summary retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     totalCourses:
     *                       type: integer
     *                     coursesInProgress:
     *                       type: integer
     *                     coursesCompleted:
     *                       type: integer
     *                     totalLessonsCompleted:
     *                       type: integer
     *                     progressByCourseName:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           courseId:
     *                             type: string
     *                           courseName:
     *                             type: string
     *                           percentComplete:
     *                             type: integer
     *                           lessonsCompleted:
     *                             type: integer
     *                           totalLessons:
     *                             type: integer
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      "/progress/summary",
      authMiddleware,
      this.controller.getProgressSummary.bind(this.controller),
    );

    /**
     * @openapi
     * /progress/me:
     *   get:
     *     tags:
     *       - Progress
     *     summary: Get all user's progress records
     *     description: Returns progress for all courses the user is enrolled in
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: All progress retrieved successfully
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
     *                       userId:
     *                         type: string
     *                       lessonsCompleted:
     *                         type: array
     *                         items:
     *                           type: string
     *                       totalLessons:
     *                         type: integer
     *                       percentComplete:
     *                         type: integer
     *                       lastActivityAt:
     *                         type: string
     *                         format: date-time
     *                 message:
     *                   type: string
     *                 total:
     *                   type: integer
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      "/progress/me",
      authMiddleware,
      this.controller.getProgressForUser.bind(this.controller),
    );

    /**
     * @openapi
     * /progress/course/{courseId}:
     *   get:
     *     tags:
     *       - Progress
     *     summary: Get progress for a specific course
     *     description: Returns the user's progress for the specified course
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the course
     *     responses:
     *       200:
     *         description: Progress retrieved successfully
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
     *                     courseId:
     *                       type: string
     *                     userId:
     *                       type: string
     *                     lessonsCompleted:
     *                       type: array
     *                       items:
     *                         type: string
     *                     totalLessons:
     *                       type: integer
     *                     percentComplete:
     *                       type: integer
     *                     lastActivityAt:
     *                       type: string
     *                       format: date-time
     *                 message:
     *                   type: string
     *       404:
     *         description: No progress found for this course
     *       401:
     *         description: Unauthorized
     *   delete:
     *     tags:
     *       - Progress
     *     summary: Delete progress for a specific course
     *     description: Removes all progress data for the specified course
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the course
     *     responses:
     *       200:
     *         description: Progress deleted successfully
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      "/progress/course/:courseId",
      authMiddleware,
      this.controller.getProgressForCourse.bind(this.controller),
    );

    this.router.delete(
      "/progress/course/:courseId",
      authMiddleware,
      this.controller.deleteProgress.bind(this.controller),
    );

    /**
     * @openapi
     * /progress/course/{courseId}/stats:
     *   get:
     *     tags:
     *       - Progress
     *     summary: Get statistics for a course
     *     description: Returns enrollment and completion statistics for a course (admin/owner view)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the course
     *     responses:
     *       200:
     *         description: Course statistics retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     totalEnrolled:
     *                       type: integer
     *                     averageCompletion:
     *                       type: integer
     *                     completedCount:
     *                       type: integer
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      "/progress/course/:courseId/stats",
      authMiddleware,
      this.controller.getCourseStatistics.bind(this.controller),
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
