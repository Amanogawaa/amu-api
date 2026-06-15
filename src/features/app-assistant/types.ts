export interface AppChat {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

export interface AppChatMessage {
  id: string;
  chatId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AskAppQuestionRequest {
  question: string;
}
