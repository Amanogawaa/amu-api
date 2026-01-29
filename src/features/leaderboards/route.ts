import { Router } from "express";
import type { LeaderboardsController } from "./controller";
import { authMiddleware } from "middlewares/auth.middleware";

export class LeaderboardsRoute {
  public router: Router;
  private controller: LeaderboardsController;

  constructor(controller: LeaderboardsController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/", this.controller.getLeaderboards.bind(this.controller));

    this.router.get(
      "/stats",
      this.controller.getLeaderboardStats.bind(this.controller),
    );

    // Get specific user's stats
    this.router.get(
      "/user/:userId",
      this.controller.getUserStats.bind(this.controller),
    );

    // Get current user's stats (no userId param)
    this.router.get(
      "/user",
      this.controller.getUserStats.bind(this.controller),
    );

    this.router.post(
      "/streak",
      authMiddleware,
      this.controller.updateStreak.bind(this.controller),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
