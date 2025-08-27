export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  type: string;
  description: string;
  duration: string;
  videoUrl?: string;
  content?: string;
  order: number;
  resources?: LessonResource[];
  questions?: Question[];
  quiz?: Quiz;
}

export interface LessonResource {
  id?: string;
  lessonId: string;
  title: string;
  url: string;
  type: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateLessonData {
  chapterId: string;
  title: string;
  type: string;
  description: string;
  duration: string;
  content: string | null;
  videoUrl: string | null;
  order: number;
}

export interface CreateResourceData {
  title: string;
  url: string;
  type: string;
}

export interface GenerateLessonsRequest {
  chapterId: string;
  chapterTitle: string;
  chapterDescription: string;
  chapterOrder: number;
  estimatedDuration: string;
  courseName: string;
  level: string;
  language: string;
}

export interface GenerateLessonsResponse {
  success: boolean;
  message: string;
  lessons: any[];
  storedLessons: Lesson[];
}

export interface Question {
  id?: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface Quiz {
  id: string;
  questions: Question[];
}
