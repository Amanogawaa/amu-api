import { Router } from "express";
import type { AuthController } from "./controller";

export class AuthRoute {
  public router: Router;
  private controller: AuthController;

  constructor(controller: AuthController) {
    this.controller = controller;
    this.router = Router();
    this.initializeRoutes();
  }
  private initializeRoutes(): void {
    /**
     * @openapi
     * /auth/signup:
     *   post:
     *     tags: [Authentication]
     *     summary: Create a new user account
     *     description: Register a new user with Firebase
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
     *               $ref: '#/components/schemas/AuthResponse'
     *       400:
     *         description: Bad request - validation error
     *       500:
     *         description: Internal server error
     */
    this.router.post(
      "/auth/signup",
      this.controller.signUp.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
