import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { lessonAssistantContainer } from "./container";
import { askQuestionSchema, chatQuerySchema } from "./validation";

// Validation middleware wrapper
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

const router = Router();

// Create or get chat session for a lesson
router.post(
  "/lessons/:lessonId/chat",
  authMiddleware,
  lessonAssistantContainer.controller.createOrGetChat.bind(
    lessonAssistantContainer.controller,
  ),
);

// Get chat history
router.get(
  "/chat/:chatId/history",
  authMiddleware,
  validate(chatQuerySchema, "query"),
  lessonAssistantContainer.controller.getChatHistory.bind(
    lessonAssistantContainer.controller,
  ),
);

// Ask a question (non-streaming)
router.post(
  "/chat/:chatId/ask",
  authMiddleware,
  validate(askQuestionSchema),
  lessonAssistantContainer.controller.askQuestion.bind(
    lessonAssistantContainer.controller,
  ),
);

// Delete chat session
router.delete(
  "/chat/:chatId",
  authMiddleware,
  lessonAssistantContainer.controller.deleteChat.bind(
    lessonAssistantContainer.controller,
  ),
);

export default router;
