import type {
  ChatMessage,
  CreateChatData,
  LessonChat,
  LessonContext,
} from "./types";
import { LessonAssistantRepository } from "./repository";
import { ContextBuilder } from "./context-builder";
import { buildAssistantSystemPrompt } from "../../utils/prompts/lesson-assistant-temp";
import { geminiCall } from "../../utils/geminiCall";
import { logger } from "../../utils/loggers";
import { NotFoundError, ValidationError } from "../../utils/errors";

export class LessonAssistantService {
  private repository: LessonAssistantRepository;
  private contextBuilder: ContextBuilder;

  constructor(
    repository: LessonAssistantRepository,
    contextBuilder: ContextBuilder,
  ) {
    this.repository = repository;
    this.contextBuilder = contextBuilder;
  }

  async createOrGetChatSession(
    lessonId: string,
    userId: string,
  ): Promise<LessonChat> {
    try {
      // Check if chat already exists
      const existingChat = await this.repository.getChatByLesson(
        lessonId,
        userId,
      );

      if (existingChat) {
        logger.info("Returning existing chat session", {
          chatId: existingChat.id,
          lessonId,
          userId,
        });
        return existingChat;
      }

      // Build context to get course and chapter IDs
      const context = await this.contextBuilder.buildLessonContext(lessonId);

      const chatData: CreateChatData = {
        lessonId,
        userId,
        courseId: context.course.id,
        chapterId: context.chapter.id,
      };

      const chat = await this.repository.createChat(chatData);

      logger.info("Created new chat session", {
        chatId: chat.id,
        lessonId,
        userId,
      });

      return chat;
    } catch (error) {
      logger.error("Error creating/getting chat session:", error);
      throw error;
    }
  }

  async getChatHistory(
    chatId: string,
    userId: string,
    limit: number = 50,
  ): Promise<{ chat: LessonChat; messages: ChatMessage[] }> {
    try {
      const chat = await this.repository.getChat(chatId);

      if (!chat) {
        throw new NotFoundError("Chat session not found");
      }

      // Verify ownership
      if (chat.userId !== userId) {
        throw new ValidationError("Unauthorized access to chat");
      }

      const messages = await this.repository.getMessages(chatId, limit);

      logger.info("Fetched chat history", {
        chatId,
        messageCount: messages.length,
      });

      return { chat, messages };
    } catch (error) {
      logger.error("Error fetching chat history:", error);
      throw error;
    }
  }

  async askQuestion(
    chatId: string,
    question: string,
    userId: string,
  ): Promise<ChatMessage> {
    try {
      const chat = await this.repository.getChat(chatId);

      if (!chat) {
        throw new NotFoundError("Chat session not found");
      }

      if (chat.userId !== userId) {
        throw new ValidationError("Unauthorized access to chat");
      }

      // Build context
      const context = await this.contextBuilder.buildLessonContext(
        chat.lessonId,
      );

      // Get conversation history
      const previousMessages = await this.repository.getMessages(chatId, 10);
      const conversationHistory =
        this.buildConversationHistory(previousMessages);

      // Save user message
      const userMessage = await this.repository.saveMessage({
        chatId,
        lessonId: chat.lessonId,
        userId,
        role: "user",
        content: question,
        createdAt: new Date(),
      });

      // Build system prompt
      const systemPrompt = buildAssistantSystemPrompt(context);

      // Prepare user prompt with conversation history
      const userPrompt = conversationHistory
        ? `${conversationHistory}\n\nUser: ${question}`
        : question;

      const startTime = Date.now();

      // Call Gemini (non-streaming for REST API)
      const response = await geminiCall(userPrompt, {
        stream: false,
        systemPrompt,
        temperature: 0.7,
        benchmarkTag: "assistant:question",
        metadata: {
          lessonId: chat.lessonId,
          chatId,
        },
      });

      const processingTime = Date.now() - startTime;

      // The response is plain text when not using schema
      const assistantContent =
        typeof response === "string" ? response : JSON.stringify(response);

      // Save assistant message
      const assistantMessage = await this.repository.saveMessage({
        chatId,
        lessonId: chat.lessonId,
        userId,
        role: "assistant",
        content: assistantContent,
        metadata: {
          processingTime,
          contextSources: ["lesson", "chapter", "course"],
        },
        createdAt: new Date(),
      });

      logger.info("Question answered", {
        chatId,
        questionLength: question.length,
        responseLength: assistantContent.length,
        processingTime,
      });

      return assistantMessage;
    } catch (error) {
      logger.error("Error answering question:", error);
      throw error;
    }
  }

  async streamResponse(
    chatId: string,
    question: string,
    userId: string,
    onChunk: (chunk: string) => void | Promise<void>,
  ): Promise<ChatMessage> {
    try {
      const chat = await this.repository.getChat(chatId);

      if (!chat) {
        throw new NotFoundError("Chat session not found");
      }

      if (chat.userId !== userId) {
        throw new ValidationError("Unauthorized access to chat");
      }

      // Build context
      const context = await this.contextBuilder.buildLessonContext(
        chat.lessonId,
      );

      // Get conversation history
      const previousMessages = await this.repository.getMessages(chatId, 10);
      const conversationHistory =
        this.buildConversationHistory(previousMessages);

      // Save user message
      await this.repository.saveMessage({
        chatId,
        lessonId: chat.lessonId,
        userId,
        role: "user",
        content: question,
        createdAt: new Date(),
      });

      // Build system prompt
      const systemPrompt = buildAssistantSystemPrompt(context);

      // Prepare user prompt with conversation history
      const userPrompt = conversationHistory
        ? `${conversationHistory}\n\nUser: ${question}`
        : question;

      const startTime = Date.now();

      // Call Gemini with streaming
      const fullResponse = await geminiCall(userPrompt, {
        stream: true,
        systemPrompt,
        temperature: 0.7,
        benchmarkTag: "assistant:streaming",
        metadata: {
          lessonId: chat.lessonId,
          chatId,
        },
        onChunk,
      });

      const processingTime = Date.now() - startTime;

      // Save assistant message
      const assistantMessage = await this.repository.saveMessage({
        chatId,
        lessonId: chat.lessonId,
        userId,
        role: "assistant",
        content: fullResponse,
        metadata: {
          processingTime,
          contextSources: ["lesson", "chapter", "course"],
        },
        createdAt: new Date(),
      });

      logger.info("Streaming response completed", {
        chatId,
        questionLength: question.length,
        responseLength: fullResponse.length,
        processingTime,
      });

      return assistantMessage;
    } catch (error) {
      logger.error("Error in streaming response:", error);
      throw error;
    }
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    try {
      const chat = await this.repository.getChat(chatId);

      if (!chat) {
        throw new NotFoundError("Chat session not found");
      }

      if (chat.userId !== userId) {
        throw new ValidationError("Unauthorized to delete this chat");
      }

      await this.repository.deleteChat(chatId);

      logger.info("Chat deleted", { chatId, userId });
    } catch (error) {
      logger.error("Error deleting chat:", error);
      throw error;
    }
  }

  private buildConversationHistory(messages: ChatMessage[]): string {
    if (messages.length === 0) {
      return "";
    }

    return messages
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        return `${role}: ${msg.content}`;
      })
      .join("\n\n");
  }
}
