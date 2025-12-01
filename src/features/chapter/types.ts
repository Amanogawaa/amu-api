import type { PromptMode } from "../../utils/prompts/types";

export interface Chapter {
  id: string;
  moduleId: string;
  chapterOrder: number;
  courseName: string;
  moduleName: string;
  chapterName: string;
  chapterDescription: string;
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
  userInstructions?: string;
  promptMode?: PromptMode;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RegenerateChaptersRequest extends GenerateChaptersRequest {}

export const chaptersSchema = {
  type: "object",
  properties: {
    chapters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          chapterOrder: { type: "integer", minimum: 1 },
          chapterName: { type: "string", minLength: 5, maxLength: 100 },
          chapterDescription: {
            type: "string",
            minLength: 100,
            maxLength: 600,
          },
          estimatedDuration: { type: "string" },
          estimatedLessonCount: { type: "integer", minimum: 2, maximum: 8 },
          learningObjectives: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 4,
          },
          keyTopics: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 6,
          },
          prerequisites: {
            type: "array",
            items: { type: "string" },
          },
          practicalApplication: { type: "string" },
        },
        required: [
          "chapterOrder",
          "chapterName",
          "chapterDescription",
          "estimatedDuration",
          "estimatedLessonCount",
          "learningObjectives",
          "keyTopics",
          "prerequisites",
          "practicalApplication",
        ],
      },
    },
  },
  required: ["chapters"],
};
