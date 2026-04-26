import { Router } from "express";
import type { CodePlaygroundController } from "./controller";
import { validateExecuteCode, validateSaveWorkspace } from "./validation";
import { authMiddleware } from "../../middlewares/auth.middleware";

export class CodePlaygroundRoute {
  public router: Router;
  private controller: CodePlaygroundController;

  constructor(controller: CodePlaygroundController) {
    this.controller = controller;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/guidelines/generate/:lessonId",
      authMiddleware,
      this.controller.generateGuideline,
    );

    this.router.get(
      "/guidelines/lesson/:lessonId",
      authMiddleware,
      this.controller.getGuidelineByLesson,
    );

    this.router.get(
      "/guidelines/:id",
      authMiddleware,
      this.controller.getGuidelineById,
    );

    this.router.get(
      "/guidelines/course/:courseId",
      authMiddleware,
      this.controller.getGuidelinesByCourse,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
