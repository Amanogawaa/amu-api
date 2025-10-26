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

export const courseSchema = {
  type: 'OBJECT',
  properties: {
    course: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING' },
        subtitle: { type: 'STRING' },
        description: { type: 'STRING' },
        category: { type: 'STRING' },
        topic: { type: 'STRING' },
        level: { type: 'STRING' },
        language: { type: 'STRING' },
        prerequisites: { type: 'STRING' },
        learning_outcomes: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
        duration: { type: 'STRING' },
        no_of_chapters: { type: 'INTEGER' },
        publish: { type: 'BOOLEAN' },
        include_certificate: { type: 'BOOLEAN' },
        banner_url: { type: 'STRING' },
      },
      required: [
        'name',
        'description',
        'category',
        'topic',
        'level',
        'language',
        'prerequisites',
        'learning_outcomes',
        'duration',
        'no_of_chapters',
      ],
    },
  },
};
