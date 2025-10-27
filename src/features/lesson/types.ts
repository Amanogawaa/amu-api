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

export const lessonSchema = {
  type: 'OBJECT',
  properties: {
    lessons: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          lessonOrder: {
            type: 'NUMBER',
            description:
              'The sequential order of this lesson within the chapter (starting from 1)',
          },
          title: {
            type: 'STRING',
            description: 'Clear, descriptive title for the lesson',
          },
          type: {
            type: 'STRING',
            description: 'Type of lesson content',
            enum: ['video', 'article', 'quiz'],
          },
          duration: {
            type: 'STRING',
            description:
              'Estimated duration in format "Xm" (e.g., "15m", "30m")',
          },
          description: {
            type: 'STRING',
            description:
              'Detailed 50-100 word description of what this lesson covers',
          },
          content: {
            type: 'STRING',
            description:
              'Detailed lesson content in markdown format (for article type) or null for video/quiz',
            nullable: true,
          },
          videoSearchQuery: {
            type: 'STRING',
            description:
              'YouTube search query for finding relevant video (for video type) or null',
            nullable: true,
          },
          resources: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: {
                  type: 'STRING',
                  description: 'Title of the resource',
                },
                url: {
                  type: 'STRING',
                  description: 'URL to the resource',
                },
                type: {
                  type: 'STRING',
                  description: 'Type of resource',
                  enum: [
                    'documentation',
                    'article',
                    'tool',
                    'github',
                    'reference',
                  ],
                },
                description: {
                  type: 'STRING',
                  description:
                    'Brief description of what this resource provides',
                },
              },
              required: ['title', 'url', 'type', 'description'],
            },
            description: '2-4 supplementary learning resources',
          },
          prerequisiteKnowledge: {
            type: 'ARRAY',
            items: {
              type: 'STRING',
            },
            description:
              '2-3 key concepts students should know before this lesson',
          },
        },
        required: [
          'lessonOrder',
          'title',
          'type',
          'duration',
          'description',
          'content',
          'videoSearchQuery',
          'resources',
          'prerequisiteKnowledge',
        ],
      },
    },
  },
  required: ['lessons'],
};
