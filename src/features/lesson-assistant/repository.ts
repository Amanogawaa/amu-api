import { db } from "../../config/firebase";
import type { ChatMessage, CreateChatData, LessonChat } from "./types";
import { logger } from "../../utils/loggers";

export class LessonAssistantRepository {
  private chatsCollection = db.collection("lesson_chats");
  private messagesCollection = db.collection("chat_messages");

  async createChat(data: CreateChatData): Promise<LessonChat> {
    try {
      const chatRef = this.chatsCollection.doc();
      const now = new Date();

      const chat: LessonChat = {
        id: chatRef.id,
        lessonId: data.lessonId,
        userId: data.userId,
        courseId: data.courseId,
        chapterId: data.chapterId,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
      };

      await chatRef.set(chat);
      logger.info("Chat session created", {
        chatId: chat.id,
        lessonId: data.lessonId,
        userId: data.userId,
      });

      return chat;
    } catch (error) {
      logger.error("Error creating chat:", error);
      throw error;
    }
  }

  async getChat(chatId: string): Promise<LessonChat | null> {
    try {
      const doc = await this.chatsCollection.doc(chatId).get();
      if (!doc.exists) {
        return null;
      }

      return doc.data() as LessonChat;
    } catch (error) {
      logger.error("Error fetching chat:", error);
      throw error;
    }
  }

  async getChatByLesson(
    lessonId: string,
    userId: string,
  ): Promise<LessonChat | null> {
    try {
      const snapshot = await this.chatsCollection
        .where("lessonId", "==", lessonId)
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return null;
      }

      const chatData = doc.data() as LessonChat;
      return {
        ...chatData,
        id: doc.id,
      };
    } catch (error) {
      logger.error("Error fetching chat by lesson:", error);
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
      logger.error("Error updating chat timestamp:", error);
      throw error;
    }
  }

  async saveMessage(message: Omit<ChatMessage, "id">): Promise<ChatMessage> {
    try {
      const messageRef = this.messagesCollection.doc();

      const chatMessage: ChatMessage = {
        id: messageRef.id,
        ...message,
      };

      await messageRef.set(chatMessage);

      // Update chat timestamp
      await this.updateChatTimestamp(message.chatId);

      logger.info("Message saved", {
        messageId: chatMessage.id,
        chatId: message.chatId,
        role: message.role,
      });

      return chatMessage;
    } catch (error) {
      logger.error("Error saving message:", error);
      throw error;
    }
  }

  async getMessages(
    chatId: string,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    try {
      const snapshot = await this.messagesCollection
        .where("chatId", "==", chatId)
        .orderBy("createdAt", "asc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as ChatMessage);
    } catch (error) {
      logger.error("Error fetching messages:", error);
      throw error;
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    try {
      // Delete all messages first
      const messagesSnapshot = await this.messagesCollection
        .where("chatId", "==", chatId)
        .get();

      const batch = db.batch();
      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete the chat
      batch.delete(this.chatsCollection.doc(chatId));

      await batch.commit();

      logger.info("Chat deleted", { chatId });
    } catch (error) {
      logger.error("Error deleting chat:", error);
      throw error;
    }
  }

  async getUserQuestionCount(
    userId: string,
    timeWindowMs: number,
  ): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowMs);

      const snapshot = await this.messagesCollection
        .where("userId", "==", userId)
        .where("role", "==", "user")
        .where("createdAt", ">", cutoffTime)
        .get();

      return snapshot.size;
    } catch (error) {
      logger.error("Error fetching user question count:", error);
      throw error;
    }
  }
}
