export interface Course {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  category: string;
  topic: string;
  level: string;
  language: string;
  prerequisites?: string;
  learning_outcomes: string;
  duration: string;
  no_of_chapters: number;
  publish: boolean;
  include_certificate: boolean;
  banner_url?: string;
  last_updated: string;
}

export interface GenerateCourseRequest {
  category: string;
  topic: string;
  level: string;
  duration: string;
  noOfChapters: number;
  language: string;
}

export interface GenerateCourseResponse {
  success: boolean;
  course: Course;
}
