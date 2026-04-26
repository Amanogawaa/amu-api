import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import multer from "multer";
import type { UserController } from "./controller";

export class UserRoute {
  private userContoller: UserController;
  public router: Router = Router();

  constructor(userController: UserController) {
    this.userContoller = userController;
    this.router = Router();
    this.initializeRoutes();
  }

  public upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
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

  public initializeRoutes(): void {
    /**
     * @swagger
     * /user/profile:
     *   get:
     *     summary: Get current user profile
     *     tags: [User]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User profile retrieved successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     */
    this.router.get(
      "/user/profile",
      authMiddleware,
      this.userContoller.getUserProfile,
    );

    /**
     * @swagger
     * /user/profile/{userId}:
     *   get:
     *     summary: Get another user's public profile
     *     tags: [User]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: The user ID to fetch profile for
     *     responses:
     *       200:
     *         description: User profile retrieved successfully (excludes sensitive data like email)
     *       400:
     *         description: User ID is required
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     */
    this.router.get(
      "/user/profile/:userId",
      authMiddleware,
      this.userContoller.getOtherUserProfile,
    );

    /**
     * @swagger
     * /user/analytics/{userId}:
     *   get:
     *     summary: Get another user's public analytics
     *     tags: [User]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: The user ID to fetch analytics for
     *     responses:
     *       200:
     *         description: User analytics retrieved successfully
     *       400:
     *         description: User ID is required
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    this.router.get(
      "/user/analytics/:userId",
      authMiddleware,
      this.userContoller.getOtherUserAnalytics,
    );

    /**
     * @swagger
     * /user/profile:
     *   put:
     *     summary: Update current user profile
     *     tags: [User]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               photoURL:
     *                 type: string
     *     responses:
     *       200:
     *         description: User profile updated successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     */
    this.router.put(
      "/user/profile",
      authMiddleware,
      this.userContoller.updateUserProfile,
    );

    /**
     * @swagger
     * /user/profile/picture:
     *   post:
     *     summary: Upload profile picture
     *     tags: [User]
     *     security:
     *       - bearerAuth: []
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
     *         description: Profile picture uploaded successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     */
    this.router.post(
      "/user/profile/picture",
      authMiddleware,
      this.upload.single("file"),
      this.userContoller.uploadProfilePicture,
    );

    /**
     * @swagger
     * /user/analytics:
     *   get:
     *     summary: Get user analytics (courses created, likes, enrollments, comments)
     *     tags: [User]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User analytics retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     totalCoursesCreated:
     *                       type: number
     *                     totalLikesReceived:
     *                       type: number
     *                     totalEnrollments:
     *                       type: number
     *                     totalComments:
     *                       type: number
     *                     courses:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           courseId:
     *                             type: string
     *                           courseName:
     *                             type: string
     *                           likesCount:
     *                             type: number
     *                           enrollmentsCount:
     *                             type: number
     *                           commentsCount:
     *                             type: number
     *                           createdAt:
     *                             type: string
     *                             format: date-time
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    this.router.get(
      "/user/analytics",
      authMiddleware,
      this.userContoller.getUserAnalytics,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
