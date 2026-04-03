import { Router } from "express";
import { AuthController } from "./controller";

export class AuthRoutes {
  public router: Router;
  private authController: AuthController;

  constructor(authController: AuthController) {
    this.router = Router();
    this.authController = authController;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * POST /api/auth/register
     * Register a new user
     */
    this.router.post(
      "/auth/register",
      this.authController.register.bind(this.authController),
    );

    /**
     * POST /api/auth/login
     * Login user
     */
    this.router.post(
      "/auth/login",
      this.authController.login.bind(this.authController),
    );

    /**
     * GET /api/auth/profile/:id
     * Get user profile
     */
    this.router.get(
      "/auth/profile/:id",
      this.authController.getProfile.bind(this.authController),
    );

    /**
     * PATCH /api/auth/profile/:id
     * Update user profile
     */
    this.router.patch(
      "/auth/profile/:id",
      this.authController.updateProfile.bind(this.authController),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
