/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import type { LessonAssistantController } from "./controller";
import { askQuestionSchema, chatQuerySchema } from "./validation";

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
    } else {
      req.query = result.data;
    }

    next();
  };
};

export class LessonAssistantRoute {
  public router: Router;
  private controller: LessonAssistantController;

  constructor(controller: LessonAssistantController) {
    this.controller = controller;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /assistant/lessons/{lessonId}/chat:
     *   post:
     *     tags:
     *       - Lesson Assistant
     *     summary: Create or get chat session for a lesson
     *     description: Creates a new chat session or retrieves an existing one for the specified lesson
     *     parameters:
     *       - in: path
     *         name: lessonId
     *         required: true
     *         schema:
     *           type: string
     *         description: Lesson ID
     *     responses:
     *       200:
     *         description: Chat session created or retrieved
     *       401:
     *         description: Unauthorized
     */
    this.router.post(
      "/lessons/:lessonId/chat",
      authMiddleware,
      this.controller.createOrGetChat.bind(this.controller),
    );

    /**
     * @openapi
     * /assistant/chat/{chatId}/history:
     *   get:
     *     tags:
     *       - Lesson Assistant
     *     summary: Get chat history
     *     description: Retrieves the message history for a chat session
     *     parameters:
     *       - in: path
     *         name: chatId
     *         required: true
     *         schema:
     *           type: string
     *         description: Chat session ID
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *         description: Number of messages to return
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           minimum: 0
     *         description: Number of messages to skip
     *     responses:
     *       200:
     *         description: Chat history retrieved
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      "/chat/:chatId/history",
      authMiddleware,
      validate(chatQuerySchema, "query"),
      this.controller.getChatHistory.bind(this.controller),
    );

    /**
     * @openapi
     * /assistant/chat/{chatId}/ask:
     *   post:
     *     tags:
     *       - Lesson Assistant
     *     summary: Ask a question
     *     description: Send a question to the lesson assistant
     *     parameters:
     *       - in: path
     *         name: chatId
     *         required: true
     *         schema:
     *           type: string
     *         description: Chat session ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               question:
     *                 type: string
     *                 description: The question to ask
     *     responses:
     *       200:
     *         description: Answer generated successfully
     *       401:
     *         description: Unauthorized
     */
    this.router.post(
      "/chat/:chatId/ask",
      authMiddleware,
      validate(askQuestionSchema),
      this.controller.askQuestion.bind(this.controller),
    );

    /**
     * @openapi
     * /assistant/chat/{chatId}/ask/stream:
     *   post:
     *     tags:
     *       - Lesson Assistant
     *     summary: Ask a question with streaming response
     *     description: Send a question and receive answer via Server-Sent Events (SSE)
     *     parameters:
     *       - in: path
     *         name: chatId
     *         required: true
     *         schema:
     *           type: string
     *         description: Chat session ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               question:
     *                 type: string
     *                 description: The question to ask
     *     responses:
     *       200:
     *         description: Streaming response (text/event-stream)
     *       401:
     *         description: Unauthorized
     */
    this.router.post(
      "/chat/:chatId/ask/stream",
      authMiddleware,
      validate(askQuestionSchema),
      this.controller.askQuestionStream.bind(this.controller),
    );

    /**
     * @openapi
     * /assistant/chat/{chatId}:
     *   delete:
     *     tags:
     *       - Lesson Assistant
     *     summary: Delete chat session
     *     description: Deletes a chat session and all its messages
     *     parameters:
     *       - in: path
     *         name: chatId
     *         required: true
     *         schema:
     *           type: string
     *         description: Chat session ID
     *     responses:
     *       200:
     *         description: Chat session deleted
     *       401:
     *         description: Unauthorized
     */
    this.router.delete(
      "/chat/:chatId",
      authMiddleware,
      this.controller.deleteChat.bind(this.controller),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
