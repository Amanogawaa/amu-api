import type { Request, Response } from "express";
import { RecommendationService } from "./service";
import type { RecommendationResponse } from "./types";
import { AppError } from "../../core/utils/errors";

export class RecommendationController {
  private service: RecommendationService;

  constructor(service: RecommendationService) {
    this.service = service;
  }

  async getLearningContinuityRecommendations(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { courseId } = req.params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.uid;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const { recommendations, fromCache } =
      await this.service.getLearningContinuityRecommendations({
        userId,
        completedCourseId: courseId,
        limit,
      });

    const response: RecommendationResponse = {
      recommendations,
      type: "learning-continuity",
      generatedAt: new Date().toISOString(),
      fromCache,
    };

    res.status(200).json(response);
  }

  async getLikedBasedRecommendations(
    req: Request,
    res: Response,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.uid;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { recommendations, fromCache } =
      await this.service.getLikedCoursesRecommendations({
        userId,
        limit,
      });

    const response: RecommendationResponse = {
      recommendations,
      type: "liked-based",
      generatedAt: new Date().toISOString(),
      fromCache,
    };

    res.status(200).json(response);
  }

  async refreshRecommendations(req: Request, res: Response): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.uid;
    const { type, courseId } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await this.service.invalidateCache(userId, type, courseId);

    res.status(200).json({
      message: "Recommendation cache refreshed successfully",
      type,
      courseId: courseId || null,
    });
  }
}
