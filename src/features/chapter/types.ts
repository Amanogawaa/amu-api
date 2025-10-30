export interface Chapter {
  id: string;
  courseId: string;
  courseName: string;
  chapterOrder: number;
  title: string;
  description: string;
  estimatedDuration: string;
  learningObjectives: string[];
  keyTopics: string[];
  estimatedLessonCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChapterResponse {
  data: Chapter | Chapter[];
  message: string;
  total?: number;
}

export interface GenerateChaptersRequest {
  moduleId: string;
  moduleName: string;
  moduleDescription: string;
  moduleLearningObjectives: string[];
  moduleKeySkills: string[];
  estimatedDuration: string;
  estimatedChapterCount: number;
  courseName: string;
  level: string;
  language: string;
  moduleOrder: number;
}

export const chaptersSchema = {
  type: 'object',
  properties: {
    chapters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          chapterOrder: { type: 'integer', minimum: 1 },
          title: { type: 'string', minLength: 5, maxLength: 100 },
          description: { type: 'string', minLength: 100, maxLength: 600 },
          estimatedDuration: { type: 'string' },
          estimatedLessonCount: { type: 'integer', minimum: 2, maximum: 8 },
          learningObjectives: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
            maxItems: 4,
          },
          keyTopics: {
            type: 'array',
            items: { type: 'string' },
            minItems: 3,
            maxItems: 6,
          },
          prerequisites: {
            type: 'array',
            items: { type: 'string' },
          },
          practicalApplication: { type: 'string' },
        },
        required: [
          'chapterOrder',
          'title',
          'description',
          'estimatedDuration',
          'learningObjectives',
          'keyTopics',
        ],
      },
    },
  },
  required: ['chapters'],
};
