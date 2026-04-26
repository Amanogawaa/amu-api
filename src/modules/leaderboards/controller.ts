/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from "express";
import type { LeaderboardsService } from "./service";
import type { LeaderboardFilters } from "./types";
import { logger } from "core/utils/loggers";

export class LeaderboardsController {
  private leaderboardsService: LeaderboardsService;

  constructor(leaderboardsService: LeaderboardsService) {
    this.leaderboardsService = leaderboardsService;
  }

  async getLeaderboards(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, period, sortBy } = req.query;

      const filters: LeaderboardFilters = {
        limit: limit ? Number.parseInt(limit as string) : 100,
        period: period as "all-time" | "monthly" | "weekly" | undefined,
        sortBy: sortBy as
          | "score"
          | "lessons"
          | "courses"
          | "streak"
          | undefined,
      };

      const leaderboards =
        await this.leaderboardsService.getLeaderboards(filters);

      // Get user rank if authenticated
      let userRank: number | undefined;
      const userId = (req as any).user?.uid;
      if (userId) {
        userRank = await this.leaderboardsService.getUserRank(
          userId,
          filters.sortBy || "score",
        );
      }

      logger.info("Leaderboards fetched successfully");
      res.status(200).json({
        data: leaderboards,
        total: leaderboards.length,
        userRank,
        message: "Leaderboards fetched successfully",
      });
    } catch (error) {
      logger.error("Error fetching leaderboards:", error);
      next(error);
    }
  }

  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId || (req as any).user?.uid;

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      const stats = await this.leaderboardsService.getUserStats(userId);
      const rank = await this.leaderboardsService.getUserRank(userId);

      logger.info(`User stats fetched for user: ${userId}`);
      res.status(200).json({
        data: {
          ...stats,
          rank,
        },
        message: "User stats fetched successfully",
      });
    } catch (error) {
      logger.error("Error fetching user stats:", error);
      next(error);
    }
  }

  async updateStreak(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.uid;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const streakData = await this.leaderboardsService.updateUserActivity({
        userId,
        activityDate: req.body.activityDate
          ? new Date(req.body.activityDate)
          : undefined,
      });

      logger.info(`Streak updated for user: ${userId}`);
      res.status(200).json({
        data: streakData,
        message: "Streak updated successfully",
      });
    } catch (error) {
      logger.error("Error updating streak:", error);
      next(error);
    }
  }

  async getLeaderboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await this.leaderboardsService.getLeaderboardStats();

      logger.info("Leaderboard stats fetched successfully");
      res.status(200).json({
        data: stats,
        message: "Leaderboard stats fetched successfully",
      });
    } catch (error) {
      logger.error("Error fetching leaderboard stats:", error);
      next(error);
    }
  }
}
