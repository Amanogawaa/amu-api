import { db } from "../../config/firebase";
import type { AppChat, AppChatMessage } from "./types";
import { logger } from "../../utils/loggers";

export class AppAssistantRepository {
  private chatsCollection = db.collection("app_chats");
  private messagesCollection = db.collection("app_chat_messages");

  async createChat(userId: string): Promise<AppChat> {
    try {
      const chatRef = this.chatsCollection.doc();
      const now = new Date();

      const chat: AppChat = {
        id: chatRef.id,
        userId,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
      };

      await chatRef.set(chat);
      logger.info("App chat session created", {
        chatId: chat.id,
        userId,
      });

      return chat;
    } catch (error) {
      logger.error("Error creating app chat:", error);
      throw error;
    }
  }

  async getChat(chatId: string): Promise<AppChat | null> {
    try {
      const doc = await this.chatsCollection.doc(chatId).get();
      if (!doc.exists) {
        return null;
      }
      return doc.data() as AppChat;
    } catch (error) {
      logger.error("Error fetching app chat:", error);
      throw error;
    }
  }

  async getActiveChatByUser(userId: string): Promise<AppChat | null> {
    try {
      const snapshot = await this.chatsCollection
        .where("userId", "==", userId)
        .orderBy("updatedAt", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return null;
      }

      const chatData = doc.data() as AppChat;
      return {
        ...chatData,
        id: doc.id,
      };
    } catch (error) {
      logger.error("Error fetching active app chat:", error);
      throw error;
    }
  }

  async updateChatTimestamp(chatId: string): Promise<void> {
    try {
      await this.chatsCollection.doc(chatId).update({
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      logger.error("Error updating app chat timestamp:", error);
      throw error;
    }
  }

  async saveMessage(message: Omit<AppChatMessage, "id">): Promise<AppChatMessage> {
    try {
      const messageRef = this.messagesCollection.doc();

      const chatMessage: AppChatMessage = {
        id: messageRef.id,
        ...message,
      };

      await messageRef.set(chatMessage);

      await this.updateChatTimestamp(message.chatId);

      logger.info("App message saved", {
        messageId: chatMessage.id,
        chatId: message.chatId,
        role: message.role,
      });

      return chatMessage;
    } catch (error) {
      logger.error("Error saving app message:", error);
      throw error;
    }
  }

  async getMessages(chatId: string, limit: number = 50): Promise<AppChatMessage[]> {
    try {
      const snapshot = await this.messagesCollection
        .where("chatId", "==", chatId)
        .orderBy("createdAt", "asc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as AppChatMessage);
    } catch (error) {
      logger.error("Error fetching app messages:", error);
      throw error;
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    try {
      const messagesSnapshot = await this.messagesCollection
        .where("chatId", "==", chatId)
        .get();

      const batch = db.batch();
      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      batch.delete(this.chatsCollection.doc(chatId));
      await batch.commit();

      logger.info("App chat deleted", { chatId });
    } catch (error) {
      logger.error("Error deleting app chat:", error);
      throw error;
    }
  }
}
