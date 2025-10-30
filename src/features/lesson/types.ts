export interface Lesson {
  id: string;
  chapterId: string;
  lessonOrder: number;
  title: string;
  type: 'video' | 'article' | 'quiz';
  duration: string;
  description: string;
  content: string | null;
  videoSearchQuery: string | null;
  resources: LessonResource[];
  prerequisiteKnowledge: string[];
}

export interface LessonResource {
  title: string;
  url: string;
  type: 'documentation' | 'article' | 'tool' | 'github' | 'reference';
  description: string;
}

export interface GenerateLessonRequest {
  chapterId: string;
  chapterTitle: string;
  chapterDescription: string;
  chapterOrder: number;
  learningObjectives: string[];
  keyTopics: string[];
  estimatedDuration: string;
  estimatedLessonCount: number;
  courseName: string;
  level: string;
  language: string;
}

export interface LessonResponse {
  data: Lesson | Lesson[];
  message: string;
  total?: number;
}

export const lessonsSchema = {
  type: 'object',
  properties: {
    lessons: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          lessonOrder: { type: 'integer', minimum: 1 },
          title: { type: 'string' },
          type: {
            type: 'string',
            enum: ['video', 'article', 'quiz', 'exercise'],
          },
          duration: { type: 'string', pattern: '^\\d+m$' }, // e.g., "15m"
          description: { type: 'string' },
          content: {
            type: ['string', 'null'],
            minLength: 100, // Only for article type
          },
          videoSearchQuery: { type: ['string', 'null'] },
          resources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                url: { type: 'string' },
                type: {
                  type: 'string',
                  enum: [
                    'documentation',
                    'article',
                    'tool',
                    'github',
                    'video',
                    'interactive',
                  ],
                },
                description: { type: 'string' },
              },
              required: ['title', 'url', 'type'],
            },
          },
          learningOutcome: { type: 'string' },
          prerequisites: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['lessonOrder', 'title', 'type', 'duration', 'description'],
      },
    },
  },
  required: ['lessons'],
};
