import { Router } from "express";
import type { CommentsController } from "./controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

export class CommentsRoute {
  public router: Router;
  private controller: CommentsController;

  constructor(commentsController: CommentsController) {
    this.controller = commentsController;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /courses/{courseId}/comments:
     *   post:
     *     tags:
     *       - Comments
     *     summary: Create a comment on a course
     *     description: Add a new comment or reply to an existing comment
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the course
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - courseId
     *               - content
     *             properties:
     *               courseId:
     *                 type: string
     *               content:
     *                 type: string
     *                 maxLength: 1000
     *               parentId:
     *                 type: string
     *                 description: ID of parent comment for threading
     *     responses:
     *       201:
     *         description: Comment created successfully
     *       401:
     *         description: Unauthorized
     *   get:
     *     tags:
     *       - Comments
     *     summary: Get comments for a course
     *     description: Returns paginated list of comments for a course
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 20
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *       - in: query
     *         name: parentId
     *         schema:
     *           type: string
     *         description: Filter by parent comment ID (null for top-level)
     *     responses:
     *       200:
     *         description: Comments retrieved successfully
     */
    this.router.post(
      "/courses/:courseId/comments",
      authMiddleware,
      this.controller.createComment.bind(this.controller),
    );

    this.router.get(
      "/courses/:courseId/comments",
      authMiddleware,
      this.controller.getCommentsForCourse.bind(this.controller),
    );

    /**
     * @openapi
     * /comments/{commentId}:
     *   get:
     *     tags:
     *       - Comments
     *     summary: Get a single comment
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: commentId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Comment retrieved successfully
     *       404:
     *         description: Comment not found
     *   patch:
     *     tags:
     *       - Comments
     *     summary: Update a comment
     *     description: Update comment content (author only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: commentId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - content
     *             properties:
     *               content:
     *                 type: string
     *                 maxLength: 1000
     *     responses:
     *       200:
     *         description: Comment updated successfully
     *       403:
     *         description: Not authorized
     *   delete:
     *     tags:
     *       - Comments
     *     summary: Delete a comment
     *     description: Delete comment (author or course owner)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: commentId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Comment deleted successfully
     *       403:
     *         description: Not authorized
     */
    this.router.get(
      "/comments/:commentId",
      authMiddleware,
      this.controller.getCommentById.bind(this.controller),
    );

    this.router.patch(
      "/comments/:commentId",
      authMiddleware,
      this.controller.updateComment.bind(this.controller),
    );

    this.router.delete(
      "/comments/:commentId",
      authMiddleware,
      this.controller.deleteComment.bind(this.controller),
    );

    /**
     * @openapi
     * /comments/me:
     *   get:
     *     tags:
     *       - Comments
     *     summary: Get all comments by current user
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User comments retrieved successfully
     */
    this.router.get(
      "/comments/me",
      authMiddleware,
      this.controller.getMyComments.bind(this.controller),
    );

    /**
     * @openapi
     * /comments/{commentId}/replies:
     *   get:
     *     tags:
     *       - Comments
     *     summary: Get replies to a comment
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: commentId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Replies retrieved successfully
     */
    this.router.get(
      "/comments/:commentId/replies",
      authMiddleware,
      this.controller.getReplies.bind(this.controller),
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
