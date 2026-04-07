import type { PromptMode } from "../../core/ai/prompts/types";

export interface Chapter {
  _id: string;
  courseId: string;
  courseName: string;
  chapterOrder: number;
  chapterName: string;
  chapterDescription: string;
  estimatedDuration: string;
  learningObjectives: string[];
  keyTopics: string[];
  prerequisites: string[];
  practicalApplication: string;
  estimatedLessonCount: number;
}

export interface GenerateChaptersRequest {
  courseId: string;
  courseName: string;
  level: string;
  noOfChapters: number;
  duration: string;
  language: string;
  description: string;
  learningOutcomes: string[];
  skillsGained: string[];
  prerequisites: string;
  userInstructions?: string;
  promptMode?: PromptMode;
}

export interface UpdateChapterDTO {
  chapterName?: string;
  chapterDescription?: string;
  chapterOrder?: number;
  estimatedDuration?: string;
  learningObjectives?: string[];
  keyTopics?: string[];
  prerequisites?: string[];
  practicalApplication?: string;
  estimatedLessonCount?: number;
}

export interface RegenerateChaptersRequest extends GenerateChaptersRequest {}

export interface ChapterWithLessons extends Chapter {
  lessons?: any[];
}

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

export interface GenerateSingleChapterRequest {
  courseId: string;
  courseName: string;
  courseDescription: string;
  moduleIndex: number;
  totalModules: number;
  level: string;
  language: string;
  duration: string;

  previousModules?: Array<{
    chapterName: string;
    description: string;
    learningObjectives: string[];
    keyTopics: string[];
  }>;

  learningOutcomes?: string[];
  skillsGained?: string[];
  prerequisites?: string;
  userInstructions?: string;
  promptMode?: PromptMode;
}

export interface ChapterGenerationContext {
  completedModules: Chapter[];
  totalModules: number;
  currentModuleIndex: number;
}

export const singleChapterSchema = {
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
      maxItems: 6,
    },
    keyTopics: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 8,
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
};
