import { Router } from 'express';
import type { CapstoneController } from './controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export class CapstoneRoute {
  public router: Router;
  private controller: CapstoneController;

  constructor(controller: CapstoneController) {
    this.controller = controller;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // ==================== CAPSTONE GUIDELINES ====================

    /**
     * @openapi
     * /capstone/guidelines/course/{courseId}:
     *   get:
     *     tags:
     *       - Capstone
     *     summary: Get capstone guideline for a course
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Capstone guideline retrieved successfully
     *       404:
     *         description: Guideline not found
     */
    this.router.get(
      '/guidelines/course/:courseId',
      this.controller.getGuidelineByCourseId
    );

    /**
     * @openapi
     * /capstone/guidelines/{id}:
     *   get:
     *     tags:
     *       - Capstone
     *     summary: Get capstone guideline by ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Guideline retrieved successfully
     *       404:
     *         description: Guideline not found
     */
    this.router.get('/guidelines/:id', this.controller.getGuidelineById);

    // ==================== CAPSTONE SUBMISSIONS ====================

    /**
     * @openapi
     * /capstone/submissions:
     *   post:
     *     tags:
     *       - Capstone
     *     summary: Create a new capstone submission
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
     *               - guidelineId
     *               - githubRepoUrl
     *               - title
     *               - description
     *             properties:
     *               courseId:
     *                 type: string
     *               guidelineId:
     *                 type: string
     *               githubRepoUrl:
     *                 type: string
     *                 format: uri
     *               title:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Submission created successfully
     *       400:
     *         description: Invalid request
     *       401:
     *         description: Unauthorized
     */
    this.router.post(
      '/submissions',
      authMiddleware,
      this.controller.createSubmission
    );

    /**
     * @openapi
     * /capstone/submissions:
     *   get:
     *     tags:
     *       - Capstone
     *     summary: Get capstone submissions with filters
     *     parameters:
     *       - in: query
     *         name: courseId
     *         schema:
     *           type: string
     *       - in: query
     *         name: userId
     *         schema:
     *           type: string
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [recent, popular, mostReviewed, topRated]
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *     responses:
     *       200:
     *         description: Submissions retrieved successfully
     */
    this.router.get('/submissions', this.controller.getSubmissions);

    /**
     * @openapi
     * /capstone/submissions/{id}:
     *   get:
     *     tags:
     *       - Capstone
     *     summary: Get capstone submission by ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Submission retrieved successfully
     *       404:
     *         description: Submission not found
     */
    this.router.get('/submissions/:id', this.controller.getSubmissionById);

    /**
     * @openapi
     * /capstone/submissions/{id}:
     *   put:
     *     tags:
     *       - Capstone
     *     summary: Update capstone submission
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               githubRepoUrl:
     *                 type: string
     *               title:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       200:
     *         description: Submission updated successfully
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Submission not found
     */
    this.router.put(
      '/submissions/:id',
      authMiddleware,
      this.controller.updateSubmission
    );

    /**
     * @openapi
     * /capstone/submissions/{id}:
     *   delete:
     *     tags:
     *       - Capstone
     *     summary: Delete capstone submission
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Submission deleted successfully
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Submission not found
     */
    this.router.delete(
      '/submissions/:id',
      authMiddleware,
      this.controller.deleteSubmission
    );

    // ==================== CAPSTONE REVIEWS ====================

    /**
     * @openapi
     * /capstone/reviews:
     *   post:
     *     tags:
     *       - Capstone
     *     summary: Create a review for a capstone submission
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - capstoneSubmissionId
     *               - rating
     *               - feedback
     *               - highlights
     *               - suggestions
     *             properties:
     *               capstoneSubmissionId:
     *                 type: string
     *               rating:
     *                 type: integer
     *                 minimum: 1
     *                 maximum: 5
     *               feedback:
     *                 type: string
     *               highlights:
     *                 type: array
     *                 items:
     *                   type: string
     *               suggestions:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       201:
     *         description: Review created successfully
     *       400:
     *         description: Invalid request
     *       401:
     *         description: Unauthorized
     */
    this.router.post('/reviews', authMiddleware, this.controller.createReview);

    /**
     * @openapi
     * /capstone/reviews:
     *   get:
     *     tags:
     *       - Capstone
     *     summary: Get reviews with filters
     *     parameters:
     *       - in: query
     *         name: capstoneSubmissionId
     *         schema:
     *           type: string
     *       - in: query
     *         name: reviewerId
     *         schema:
     *           type: string
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *     responses:
     *       200:
     *         description: Reviews retrieved successfully
     */
    this.router.get('/reviews', this.controller.getReviews);

    /**
     * @openapi
     * /capstone/reviews/{id}:
     *   get:
     *     tags:
     *       - Capstone
     *     summary: Get review by ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Review retrieved successfully
     *       404:
     *         description: Review not found
     */
    this.router.get('/reviews/:id', this.controller.getReviewById);

    /**
     * @openapi
     * /capstone/reviews/{id}:
     *   put:
     *     tags:
     *       - Capstone
     *     summary: Update review
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               rating:
     *                 type: integer
     *               feedback:
     *                 type: string
     *               highlights:
     *                 type: array
     *                 items:
     *                   type: string
     *               suggestions:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       200:
     *         description: Review updated successfully
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Review not found
     */
    this.router.put(
      '/reviews/:id',
      authMiddleware,
      this.controller.updateReview
    );

    /**
     * @openapi
     * /capstone/reviews/{id}:
     *   delete:
     *     tags:
     *       - Capstone
     *     summary: Delete review
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Review deleted successfully
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Review not found
     */
    this.router.delete(
      '/reviews/:id',
      authMiddleware,
      this.controller.deleteReview
    );

    // ==================== CAPSTONE LIKES ====================

    /**
     * @openapi
     * /capstone/submissions/{id}/like:
     *   post:
     *     tags:
     *       - Capstone
     *     summary: Toggle like on a capstone submission
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Like toggled successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Submission not found
     */
    this.router.post(
      '/submissions/:id/like',
      authMiddleware,
      this.controller.toggleLike
    );

    /**
     * @openapi
     * /capstone/submissions/{id}/like-status:
     *   get:
     *     tags:
     *       - Capstone
     *     summary: Get like status for a submission
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Like status retrieved successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Submission not found
     */
    this.router.get(
      '/submissions/:id/like-status',
      authMiddleware,
      this.controller.getLikeStatus
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
