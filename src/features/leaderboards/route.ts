import { Router } from "express";
import type { LeaderboardsController } from "./controller";

export class LeaderboardsRoute {
  public router: Router;
  private controller: LeaderboardsController;

  constructor(controller: LeaderboardsController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      "/leaderboards",
      this.controller.getLeaderboards.bind(this.controller),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
