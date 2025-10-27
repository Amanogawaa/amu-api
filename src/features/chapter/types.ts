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
  courseId: string;
  courseName: string;
  description: string;
  learningOutcomes: string[];
  duration: string;
  noOfChapters: string;
  level: string;
  language: string;
  prerequisites?: string;
}

export const chapterSchema = {
  type: 'OBJECT',
  properties: {
    chapters: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          chapterOrder: {
            type: 'NUMBER',
            description:
              'The sequential order of this chapter (starting from 1)',
          },
          title: {
            type: 'STRING',
            description: 'The title of the chapter',
          },
          description: {
            type: 'STRING',
            description:
              'A comprehensive 100-150 word description of what this chapter covers',
          },
          estimatedDuration: {
            type: 'STRING',
            description:
              'Estimated duration in format "Xh Ym" (e.g., "1h 30m" or "45m")',
          },
          learningObjectives: {
            type: 'ARRAY',
            items: {
              type: 'STRING',
            },
            description: '3-5 specific learning objectives for this chapter',
          },
          keyTopics: {
            type: 'ARRAY',
            items: {
              type: 'STRING',
            },
            description: '3-6 main topics/concepts covered in this chapter',
          },
          estimatedLessonCount: {
            type: 'NUMBER',
            description: 'Estimated number of lessons in this chapter (3-6)',
          },
        },
        required: [
          'chapterOrder',
          'title',
          'description',
          'estimatedDuration',
          'learningObjectives',
          'keyTopics',
          'estimatedLessonCount',
        ],
      },
    },
  },
  required: ['chapters'],
};
