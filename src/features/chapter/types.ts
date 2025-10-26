export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  description: string;
  estimatedTime: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChapterResponse {
  data: Chapter | Chapter[];
  message: string;
  total?: number;
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

export const chapterSchema = {
  type: 'OBJECT',
  properties: {
    chapters: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: {
            type: 'STRING',
            description: 'The title of the chapter',
          },
          description: {
            type: 'STRING',
            description: 'A detailed description of what this chapter covers',
          },
          estimatedTime: {
            type: 'NUMBER',
            description: 'Estimated time in minutes to complete this chapter',
          },
          order: {
            type: 'NUMBER',
            description:
              'The sequential order of this chapter (starting from 1)',
          },
        },
        required: ['title', 'description', 'estimatedTime', 'order'],
      },
    },
  },
  required: ['chapters'],
};
