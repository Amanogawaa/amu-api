import { Router } from 'express';
import { AuthController } from './controller';
import { authMiddleware } from '../../core/middlewares/auth';

export class AuthRoute {
  public router: Router;
  private controller: AuthController;

  constructor(controller: AuthController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /auth/signup:
     *   post:
     *     tags: [Authentication]
     *     summary: Create a new user account
     *     description: Register a new user with email, password, and optional name
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SignUpRequest'
     *     responses:
     *       201:
     *         description: User account created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     user: { $ref: '#/components/schemas/UserProfile' }
     *                     message: { type: string }
     *                 status: { type: string, example: 'success' }
     *       400:
     *         description: Bad request - validation error
     *       500:
     *         description: Internal server error
     */
    this.router.post(
      '/auth/signup',
      this.controller.signUp.bind(this.controller)
    );

    /**
     * @openapi
     * /auth/signin:
     *   post:
     *     tags: [Authentication]
     *     summary: Sign in to existing account
     *     description: Authenticate user with email and password
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SignInRequest'
     *     responses:
     *       200:
     *         description: User signed in successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     user: { $ref: '#/components/schemas/UserProfile' }
     *                     message: { type: string }
     *                 status: { type: string, example: 'success' }
     *       401:
     *         description: Invalid credentials
     *       500:
     *         description: Internal server error
     */
    this.router.post(
      '/auth/signin',
      this.controller.signIn.bind(this.controller)
    );

    /**
     * @openapi
     * /auth/refresh:
     *   post:
     *     tags: [Authentication]
     *     summary: Refresh access token
     *     description: Get new access token using refresh token
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RefreshTokenRequest'
     *     responses:
     *       200:
     *         description: Token refreshed successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     user: { $ref: '#/components/schemas/UserProfile' }
     *                     message: { type: string }
     *                 status: { type: string, example: 'success' }
     *       401:
     *         description: Invalid refresh token
     *       500:
     *         description: Internal server error
     */
    this.router.post(
      '/auth/refresh',
      this.controller.refreshToken.bind(this.controller)
    );

    /**
     * @openapi
     * /auth/signout:
     *   post:
     *     tags: [Authentication]
     *     summary: Sign out user
     *     description: Sign out user and invalidate session
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User signed out successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     message: { type: string }
     *                 status: { type: string, example: 'success' }
     *       401:
     *         description: Unauthorized - invalid token
     *       500:
     *         description: Internal server error
     */
    this.router.post(
      '/auth/signout',
      authMiddleware,
      this.controller.signOut.bind(this.controller)
    );

    /**
     * @openapi
     * /auth/profile:
     *   get:
     *     tags: [Authentication]
     *     summary: Get user profile
     *     description: Retrieve current user's profile information
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User profile retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data: { $ref: '#/components/schemas/UserProfile' }
     *                 status: { type: string, example: 'success' }
     *       401:
     *         description: Unauthorized - invalid token
     *       404:
     *         description: Profile not found
     *       500:
     *         description: Internal server error
     */
    this.router.get(
      '/auth/profile',
      authMiddleware,
      this.controller.getProfile.bind(this.controller)
    );

    /**
     * @openapi
     * /auth/profile:
     *   put:
     *     tags: [Authentication]
     *     summary: Update user profile
     *     description: Update current user's profile information
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ProfileUpdateRequest'
     *     responses:
     *       200:
     *         description: Profile updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     profile: { $ref: '#/components/schemas/UserProfile' }
     *                     message: { type: string }
     *                 status: { type: string, example: 'success' }
     *       400:
     *         description: Bad request - validation error
     *       401:
     *         description: Unauthorized - invalid token
     *       500:
     *         description: Internal server error
     */
    this.router.put(
      '/auth/profile',
      authMiddleware,
      this.controller.updateProfile.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
