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
      "/code/execute",
      authMiddleware,
      validateExecuteCode,
      this.controller.executeCode,
    );

    this.router.get(
      "/piston/languages",
      authMiddleware,
      this.controller.getPistonSupportedLanguages,
    );

    this.router.post(
      "/piston/execute",
      authMiddleware,
      this.controller.pistonExecuteCode,
    );

    this.router.post(
      "/judge0/execute",
      authMiddleware,
      validateExecuteCode,
      this.controller.judge0ExecuteCode,
    );

    this.router.get(
      "/judge0/languages",
      authMiddleware,
      this.controller.getJudge0SupportedLanguages,
    );

    this.router.post(
      "/code/execute-and-save",
      authMiddleware,
      validateExecuteCode,
      this.controller.executeAndSave,
    );

    this.router.post(
      "/code/workspace",
      authMiddleware,
      validateSaveWorkspace,
      this.controller.saveWorkspace,
    );

    this.router.get(
      "/code/workspace/:lessonId",
      authMiddleware,
      this.controller.getWorkspace,
    );

    this.router.get(
      "/code/workspaces/course/:courseId",
      authMiddleware,
      this.controller.getWorkspacesByCourse,
    );

    this.router.delete(
      "/code/workspace/:workspaceId",
      authMiddleware,
      this.controller.deleteWorkspace,
    );

    this.router.get("/code/languages", this.controller.getSupportedLanguages);
  }

  public getRouter(): Router {
    return this.router;
  }
}
