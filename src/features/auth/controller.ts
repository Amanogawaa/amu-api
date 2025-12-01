import type { NextFunction, Request, Response } from "express";
import type { AuthService } from "./service";
import { logger } from "../../utils/loggers";
import type { CreateUser } from "./types";

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async signUp(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userData = request.body as CreateUser;
      const res = await this.authService.signUp(userData);

      response.status(201).json({
        message: res.message,
      });
    } catch (error) {
      logger.error("Error in AuthController.signUp:", error);
      next(error);
    }
  }
}
