import type { AppChat, AppChatMessage } from "./types";
import { AppAssistantRepository } from "./repository";
import { buildAppAssistantSystemPrompt } from "../../utils/prompts/app-assistant-temp";
import { geminiCall } from "../../utils/geminiCall";
import { logger } from "../../utils/loggers";
import { NotFoundError, ValidationError } from "../../utils/errors";

export class AppAssistantService {
  private repository: AppAssistantRepository;

  constructor(repository: AppAssistantRepository) {
    this.repository = repository;
  }

  async createOrGetChatSession(userId: string): Promise<AppChat> {
    try {
      if (userId !== "anonymous") {
        const existingChat = await this.repository.getActiveChatByUser(userId);

        if (existingChat) {
          logger.info("Returning existing app chat session", {
            chatId: existingChat.id,
            userId,
          });
          return existingChat;
        }
      }

      const chat = await this.repository.createChat(userId);

      logger.info("Created new app chat session", {
        chatId: chat.id,
        userId,
      });

      return chat;
    } catch (error) {
      logger.error("Error creating/getting app chat session:", error);
      throw error;
    }
  }

  async getChatHistory(
    chatId: string,
    userId: string,
    limit: number = 50,
  ): Promise<{ chat: AppChat; messages: AppChatMessage[] }> {
    try {
      const chat = await this.repository.getChat(chatId);

      if (!chat) {
        throw new NotFoundError("App chat session not found");
      }

      if (chat.userId !== "anonymous" && chat.userId !== userId) {
        throw new ValidationError("Unauthorized access to app chat");
      }

      const messages = await this.repository.getMessages(chatId, limit);

      logger.info("Fetched app chat history", {
        chatId,
        messageCount: messages.length,
      });

      return { chat, messages };
    } catch (error) {
      logger.error("Error fetching app chat history:", error);
      throw error;
    }
  }

  async askQuestion(
    chatId: string,
    question: string,
    userId: string,
  ): Promise<AppChatMessage> {
    try {
      const chat = await this.repository.getChat(chatId);

      if (!chat) {
        throw new NotFoundError("App chat session not found");
      }

      if (chat.userId !== "anonymous" && chat.userId !== userId) {
        throw new ValidationError("Unauthorized access to app chat");
      }

      const previousMessages = await this.repository.getMessages(chatId, 10);
      const conversationHistory = this.buildConversationHistory(previousMessages);

      await this.repository.saveMessage({
        chatId,
        userId,
        role: "user",
        content: question,
        createdAt: new Date(),
      });

      const systemPrompt = buildAppAssistantSystemPrompt();

      const userPrompt = conversationHistory
        ? `${conversationHistory}\n\nUser: ${question}`
        : question;

      const startTime = Date.now();

      const fullResponse = await geminiCall(userPrompt, {
        stream: false,
        systemPrompt,
        temperature: 0.4,
        benchmarkTag: "app-assistant:ask",
        metadata: {
          chatId,
        },
      });

      const processingTime = Date.now() - startTime;

      const assistantMessage = await this.repository.saveMessage({
        chatId,
        userId,
        role: "assistant",
        content: fullResponse,
        metadata: {
          processingTime,
        },
        createdAt: new Date(),
      });

      logger.info("App Assistant response completed", {
        chatId,
        questionLength: question.length,
        responseLength: fullResponse.length,
        processingTime,
      });

      return assistantMessage;
    } catch (error) {
      logger.error("Error in app assistant ask question:", error);
      throw error;
    }
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    try {
      const chat = await this.repository.getChat(chatId);

      if (!chat) {
        throw new NotFoundError("App chat session not found");
      }

      if (chat.userId !== "anonymous" && chat.userId !== userId) {
        throw new ValidationError("Unauthorized to delete this app chat");
      }

      await this.repository.deleteChat(chatId);

      logger.info("App chat deleted", { chatId, userId });
    } catch (error) {
      logger.error("Error deleting app chat:", error);
      throw error;
    }
  }

  private buildConversationHistory(messages: AppChatMessage[]): string {
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
