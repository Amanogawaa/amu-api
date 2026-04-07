import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./service";
import type { CreateUserDTO, LoginUserDTO } from "./type";
import { sendResponse } from "../../core/utils/response";
import { generateToken } from "../../core/utils/auth";
import type { AuthenticatedRequest } from "../../core/middlewares/auth.middleware";

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Register a new user
   */
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userData = req.body as CreateUserDTO;

      console.log(userData);
      const result = await this.authService.register(userData);

      return sendResponse(res, result, 201, "User registered successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials = req.body as LoginUserDTO;
      const result = await this.authService.login(credentials);

      // Generate JWT token
      const token = generateToken(result.user.id, res);

      return sendResponse(
        res,
        { ...result, token },
        200,
        "User logged in successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   */
  async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendResponse(res, null, 401, "Unauthorized");
      }

      const result = await this.authService.getProfile(userId);

      return sendResponse(res, result, 200, "Profile retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const updates = req.body;

      if (!userId) {
        return sendResponse(res, null, 401, "Unauthorized");
      }

      const result = await this.authService.updateProfile(userId, updates);

      return sendResponse(res, result, 200, "Profile updated successfully");
    } catch (error) {
      next(error);
    }
  }
}
