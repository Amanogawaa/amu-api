/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import type { AppAssistantController } from "./controller";
import { askAppQuestionSchema, appChatQuerySchema } from "./validation";

const validate = (schema: any, source: "body" | "query" = "body") => {
  return (req: any, res: any, next: any) => {
    const data = source === "query" ? req.query : req.body;
    const result = schema.safeParse(data);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.errors,
      });
    }

    if (source === "body") {
      req.body = result.data;
    }

    next();
  };
};

export class AppAssistantRoute {
  public router: Router;
  private controller: AppAssistantController;

  constructor(controller: AppAssistantController) {
    this.controller = controller;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/app/chat",
      this.controller.createOrGetChat.bind(this.controller),
    );

    this.router.get(
      "/app/chat/:chatId/history",
      validate(appChatQuerySchema, "query"),
      this.controller.getChatHistory.bind(this.controller),
    );

    this.router.post(
      "/app/chat/:chatId/ask",
      validate(askAppQuestionSchema),
      this.controller.askQuestion.bind(this.controller),
    );

    this.router.delete(
      "/app/chat/:chatId",
      this.controller.deleteChat.bind(this.controller),
    );
  }

  public getRouter(): Router {
    // Return router under /assistant so it matches standard
    const baseRouter = Router();
    baseRouter.use("/assistant", this.router);
    return baseRouter;
  }
}
