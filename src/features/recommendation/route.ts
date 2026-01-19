import { Router } from "express";
import { RecommendationController } from "./controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validateCourseId, validateLimitParam } from "./validation";

export class RecommendationRoute {
  public router: Router;
  private controller: RecommendationController;

  constructor(controller: RecommendationController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /api/recommendations/learning-continuity/{courseId}:
     *   get:
     *     summary: Get course recommendations after completing a course
     *     description: Returns personalized course recommendations based on learning continuity algorithm
     *     tags:
     *       - Recommendations
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the completed course
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 50
     *           default: 10
     *         description: Maximum number of recommendations to return
     *     responses:
     *       200:
     *         description: Successfully retrieved recommendations
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 recommendations:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       courseId:
     *                         type: string
     *                       course:
     *                         type: object
     *                         properties:
     *                           name:
     *                             type: string
     *                           topic:
     *                             type: string
     *                           level:
     *                             type: string
     *                           description:
     *                             type: string
     *                           category:
     *                             type: string
     *                           authorId:
     *                             type: string
     *                           enrollmentCount:
     *                             type: integer
     *                           likesCount:
     *                             type: integer
     *                       score:
     *                         type: number
     *                         description: Relevance score (0-1)
     *                       reason:
     *                         type: string
     *                         description: Explanation for recommendation
     *                       metadata:
     *                         type: object
     *                         properties:
     *                           isSequentialNext:
     *                             type: boolean
     *                           topicSimilarity:
     *                             type: number
     *                           difficultyProgression:
     *                             type: boolean
     *                 type:
     *                   type: string
     *                   enum: [learning-continuity]
     *                 generatedAt:
     *                   type: string
     *                   format: date-time
     *                 fromCache:
     *                   type: boolean
     *       401:
     *         description: Unauthorized - Invalid or missing authentication token
     *       404:
     *         description: Completed course not found
     *       500:
     *         description: Internal server error
     */
    this.router.get(
      "/learning-continuity/:courseId",
      authMiddleware,
      validateCourseId,
      validateLimitParam,
      this.controller.getLearningContinuityRecommendations.bind(
        this.controller,
      ),
    );

    /**
     * @openapi
     * /api/recommendations/refresh:
     *   post:
     *     summary: Force refresh user's recommendation cache
     *     description: Invalidates the recommendation cache for the authenticated user
     *     tags:
     *       - Recommendations
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - type
     *             properties:
     *               type:
     *                 type: string
     *                 enum: [learning-continuity, liked-based, general]
     *                 description: Type of recommendation cache to refresh
     *               courseId:
     *                 type: string
     *                 description: Optional course ID for course-specific cache
     *     responses:
     *       200:
     *         description: Cache refreshed successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 type:
     *                   type: string
     *                 courseId:
     *                   type: string
     *                   nullable: true
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    this.router.post(
      "/refresh",
      authMiddleware,
      this.controller.refreshRecommendations.bind(this.controller),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
