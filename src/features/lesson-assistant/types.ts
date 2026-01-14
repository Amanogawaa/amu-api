export interface LessonChat {
  id: string;
  lessonId: string;
  userId: string;
  courseId: string;
  chapterId: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  lessonId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    contextSources?: string[];
  };
  createdAt: Date;
}

export interface LessonContext {
  lesson: {
    id: string;
    name: string;
    description: string;
    content: string | null;
    type: "video" | "article" | "quiz";
    learningOutcome: string;
    prerequisites: string[];
    resources: Array<{
      title: string;
      url: string;
      type: string;
      description: string;
    }>;
  };
  chapter: {
    id: string;
    name: string;
    description: string;
    learningObjectives: string[];
    keyTopics: string[];
  };
  course: {
    id: string;
    name: string;
    level: string;
    category: string;
    description: string;
  };
  videoTranscript?: string;
}

export interface CreateChatRequest {
  lessonId: string;
}

export interface AskQuestionRequest {
  question: string;
  chatId?: string;
}

export interface ChatResponse {
  data: {
    chat: LessonChat;
    message?: ChatMessage;
  };
  message: string;
}

export interface ChatHistoryResponse {
  data: {
    chat: LessonChat;
    messages: ChatMessage[];
    total: number;
  };
  message: string;
}

export interface CreateChatData {
  lessonId: string;
  userId: string;
  courseId: string;
  chapterId: string;
}
