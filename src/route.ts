import { Router } from "express";
import type { AuthContainer } from "./modules/auth/container";

export class AppRoute {
  private router: Router;
  private authContainer: AuthContainer;

  constructor(authContainer: AuthContainer) {
    this.router = Router();
    this.authContainer = authContainer;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok" });
    });

    this.router.use("/", this.authContainer.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
