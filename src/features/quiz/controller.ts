import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import type { QuizService } from "./service";
import { logger } from "../../utils/loggers";
import { AppError } from "../../utils/errors";

export class QuizController {
  private service: QuizService;

  constructor(service: QuizService) {
    this.service = service;
  }

  async generateQuiz(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      logger.info("QuizController.generateQuiz - request received", {
        body: request.body,
      });

      const generateRequest = request.body;

      if (!generateRequest) {
        throw new AppError("Request body is required", 400, "MISSING_BODY");
      }

      const quiz = await this.service.generateQuiz(generateRequest);

      response.status(201).json({
        data: quiz,
        message: "Quiz generated successfully",
      });
    } catch (error) {
      logger.error("Error in QuizController.generateQuiz:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  }

  async getQuiz(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { lessonId } = request.params;
      const quiz = await this.service.getQuizForStudent(lessonId!);

      if (!quiz) {
        response.status(404).json({
          message: "Quiz not found for this lesson",
        });
        return;
      }

      response.status(200).json({
        data: quiz,
      });
    } catch (error) {
      logger.error("Error in QuizController.getQuiz:", error);
      next(error);
    }
  }

  async submitQuiz(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { quizId } = request.params;
      const userId = request.user?.uid;
      const { answers } = request.body;

      if (!userId) {
        response.status(401).json({
          message: "User not authenticated",
        });
        return;
      }

      if (!quizId) {
        response.status(400).json({
          message: "Quiz ID is required",
        });
        return;
      }

      const attempt = await this.service.submitQuiz(userId, {
        quizId,
        answers,
      });

      response.status(201).json({
        data: attempt,
        message: "Quiz submitted successfully",
      });
    } catch (error) {
      logger.error("Error in QuizController.submitQuiz:", error);
      next(error);
    }
  }

  async getUserAttempts(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { quizId } = request.params;
      const userId = request.user?.uid;

      if (!userId) {
        response.status(401).json({
          message: "User not authenticated",
        });
        return;
      }

      if (!quizId) {
        response.status(400).json({
          message: "Quiz ID is required",
        });
        return;
      }

      const attempts = await this.service.getUserAttempts(userId, quizId);

      response.status(200).json({
        data: attempts,
      });
    } catch (error) {
      logger.error("Error in QuizController.getUserAttempts:", error);
      next(error);
    }
  }

  async getAttemptById(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { attemptId } = request.params;
      const userId = request.user?.uid;

      if (!userId) {
        response.status(401).json({
          message: "User not authenticated",
        });
        return;
      }

      if (!attemptId) {
        response.status(400).json({
          message: "Attempt ID is required",
        });
        return;
      }

      const attempt = await this.service.getAttemptById(attemptId);

      if (!attempt) {
        response.status(404).json({
          message: "Attempt not found",
        });
        return;
      }

      // Verify the attempt belongs to the user
      if (attempt.userId !== userId) {
        response.status(403).json({
          message: "Access denied",
        });
        return;
      }

      response.status(200).json({
        data: attempt,
      });
    } catch (error) {
      logger.error("Error in QuizController.getAttemptById:", error);
      next(error);
    }
  }
}
