import type { NextFunction, Request, Response } from "express";
import type { LeaderboardsService } from "./service";
import { logger } from "@utils/loggers";

export class LeaderboardsController {
  private leaderboardsService: LeaderboardsService;

  constructor(leaderboardsService: LeaderboardsService) {
    this.leaderboardsService = leaderboardsService;
  }

  async getLeaderboards(req: Request, res: Response, next: NextFunction) {
    try {
      const leaderboards = await this.leaderboardsService.getLeaderboards();
      logger.info("Leaderboards fetched successfully");
      res.status(200).json(leaderboards);
    } catch (error) {
      next(error);
    }
  }
}
