import { Lesson } from '../lesson/types';

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  description: string;
  estimatedDuration: string;
  order: number;
  lessons: Lesson[];
}

export interface GenerateChaptersRequest {
  courseId: string;
  title: string;
  description: string;
  learningOutcomes: string[];
  duration: string;
  noOfChapters: number;
  level: string;
  language: string;
}

export interface GenerateChaptersResponse {
  success: boolean;
  chapters: Chapter[];
}
