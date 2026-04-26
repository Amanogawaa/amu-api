import { Router } from "express";
import type { CapstoneController } from "./controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import multer from "multer";

export class CapstoneRoute {
  public router: Router;
  private controller: CapstoneController;
  public upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Invalid file type. Only JPEG, PNG, and WebP images are allowed",
          ),
        );
      }
    },
  });

  constructor(controller: CapstoneController) {
    this.controller = controller;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // ==================== CAPSTONE GUIDELINES ====================

    /**
     * @openapi
     * /capstone/guidelines/generate/{courseId}:
     *   post:
     *     tags:
     *       - Capstone
     *     summary: Generate capstone guideline for a course
     *     description: Creates a capstone project guideline based on actual course content from the database. Should be called after course chapters and lessons are generated.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the course to generate capstone for
     *     responses:
     *       201:
     *         description: Capstone guideline generated successfully
     *       400:
     *         description: Course has no chapters/lessons yet
     *       401:
     *         description: User not authenticated
     *       404:
     *         description: Course not found
     *       409:
     *         description: Guideline already exists for this course
     */
    this.router.post(
      "/guidelines/generate/:courseId",
      authMiddleware,
      this.controller.generateGuideline,
    );

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
      "/guidelines/course/:courseId",
      this.controller.getGuidelineByCourseId,
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
    this.router.get("/guidelines/:id", this.controller.getGuidelineById);

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
      "/submissions",
      authMiddleware,
      this.controller.createSubmission,
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
    this.router.get("/submissions", this.controller.getSubmissions);

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
    this.router.get("/submissions/:id", this.controller.getSubmissionById);

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
      "/submissions/:id",
      authMiddleware,
      this.controller.updateSubmission,
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
      "/submissions/:id",
      authMiddleware,
      this.controller.deleteSubmission,
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
    this.router.post("/reviews", authMiddleware, this.controller.createReview);

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
    this.router.get("/reviews", this.controller.getReviews);

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
    this.router.get("/reviews/:id", this.controller.getReviewById);

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
      "/reviews/:id",
      authMiddleware,
      this.controller.updateReview,
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
      "/reviews/:id",
      authMiddleware,
      this.controller.deleteReview,
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
      "/submissions/:id/like",
      authMiddleware,
      this.controller.toggleLike,
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
      "/submissions/:id/like-status",
      authMiddleware,
      this.controller.getLikeStatus,
    );

    // ==================== CAPSTONE REVIEW IMAGES ====================

    /**
     * @openapi
     * /capstone/reviews/{id}/images:
     *   post:
     *     tags:
     *       - Capstone
     *     summary: Upload an image for a capstone review
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the capstone review
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Review image uploaded successfully
     *       400:
     *         description: Invalid file or request
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - can only upload to own reviews
     *       404:
     *         description: Review not found
     */
    this.router.post(
      "/reviews/:id/images",
      authMiddleware,
      this.upload.single("file"),
      this.controller.uploadReviewImage,
    );

    /**
     * @openapi
     * /capstone/reviews/{id}/images:
     *   delete:
     *     tags:
     *       - Capstone
     *     summary: Delete an image from a capstone review
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the capstone review
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - imageUrl
     *             properties:
     *               imageUrl:
     *                 type: string
     *                 description: The URL of the image to delete
     *     responses:
     *       200:
     *         description: Review image deleted successfully
     *       400:
     *         description: Invalid request
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - can only delete from own reviews
     *       404:
     *         description: Review not found
     */
    this.router.delete(
      "/reviews/:id/images",
      authMiddleware,
      this.controller.deleteReviewImage,
    );

    // ==================== CAPSTONE SCREENSHOTS ====================

    /**
     * @openapi
     * /capstone/submissions/{id}/screenshots:
     *   post:
     *     tags:
     *       - Capstone
     *     summary: Upload a screenshot for a capstone submission
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the capstone submission
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Screenshot uploaded successfully
     *       400:
     *         description: Invalid file or request
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - can only upload to own submissions
     *       404:
     *         description: Submission not found
     */
    this.router.post(
      "/submissions/:id/screenshots",
      authMiddleware,
      this.upload.single("file"),
      this.controller.uploadScreenshot,
    );

    /**
     * @openapi
     * /capstone/submissions/{id}/screenshots:
     *   delete:
     *     tags:
     *       - Capstone
     *     summary: Delete a screenshot from a capstone submission
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the capstone submission
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - screenshotUrl
     *             properties:
     *               screenshotUrl:
     *                 type: string
     *                 description: The URL of the screenshot to delete
     *     responses:
     *       200:
     *         description: Screenshot deleted successfully
     *       400:
     *         description: Invalid request
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - can only delete from own submissions
     *       404:
     *         description: Submission not found
     */
    this.router.delete(
      "/submissions/:id/screenshots",
      authMiddleware,
      this.controller.deleteScreenshot,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
