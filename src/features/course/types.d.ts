export interface Course {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  category: string;
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  prerequisites: string;
  learning_outcomes: string[];
  duration: string;
  no_of_chapters: number;
  publish: boolean;
  include_certificate: boolean;
  banner_url: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GenerateCourseRequest {
  category: string;
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  noOfChapters: number;
  language: string;
}

export interface CourseQueryParams {
  level?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  language?: string;
  limit?: number;
  offset?: number;
}

export interface CourseResponse {
  data: Course | Course[];
  message: string;
  total?: number;
}
