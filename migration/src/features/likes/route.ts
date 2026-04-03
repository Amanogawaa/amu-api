import { Router } from "express";
import type { LikesController } from "./controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

export class LikesRoute {
  public router: Router;
  private controller: LikesController;

  constructor(likesController: LikesController) {
    this.controller = likesController;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /courses/{courseId}/like:
     *   post:
     *     tags:
     *       - Likes
     *     summary: Toggle like on a course
     *     description: Like or unlike a course. Returns the new like status and count.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the course to like/unlike
     *     responses:
     *       200:
     *         description: Like toggled successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     liked:
     *                       type: boolean
     *                       description: True if now liked, false if unliked
     *                     likesCount:
     *                       type: integer
     *                       description: Total number of likes on the course
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized
     */
    this.router.post(
      "/courses/:courseId/like",
      authMiddleware,
      this.controller.toggleLike.bind(this.controller),
    );

    /**
     * @openapi
     * /courses/{courseId}/like/status:
     *   get:
     *     tags:
     *       - Likes
     *     summary: Get like status for a course
     *     description: Check if the current user has liked the course and get total likes count
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
     *         description: Like status retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     liked:
     *                       type: boolean
     *                     likesCount:
     *                       type: integer
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      "/courses/:courseId/like/status",
      authMiddleware,
      this.controller.getLikeStatus.bind(this.controller),
    );

    /**
     * @openapi
     * /courses/{courseId}/likes:
     *   get:
     *     tags:
     *       - Likes
     *     summary: Get all likes for a course
     *     description: Returns a paginated list of users who liked the course
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the course
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *         description: Number of likes to return
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *         description: Number of likes to skip
     *     responses:
     *       200:
     *         description: Likes retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     likes:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: string
     *                           courseId:
     *                             type: string
     *                           userId:
     *                             type: string
     *                           createdAt:
     *                             type: string
     *                             format: date-time
     *                     total:
     *                       type: integer
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      "/courses/:courseId/likes",
      authMiddleware,
      this.controller.getLikesForCourse.bind(this.controller),
    );

    /**
     * @openapi
     * /likes/me:
     *   get:
     *     tags:
     *       - Likes
     *     summary: Get all courses liked by current user
     *     description: Returns all courses the authenticated user has liked
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User likes retrieved successfully
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
     *                       createdAt:
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
      "/likes/me",
      authMiddleware,
      this.controller.getMyLikes.bind(this.controller),
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
