export interface Course {
  id: string;
  uid: string;
  skillsGained: string[];
  targetAudience: string;
  topic: string;
  subtitle?: string;
  publish: boolean;
  draft: boolean;
  prerequisites: string;
  noOfModules: number;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  learning_outcomes: string[];
  language: string;
  duration: string;
  description: string;
  category: string;
  supportsCodePlayground?: boolean;
  likesCount?: number;
  commentsCount?: number;
  enrollmentCount?: number;
  isEnrolled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

import type { PromptMode } from "../../utils/prompts/types";

export type CoursePromptMode = PromptMode;

export interface GenerateCourseRequest {
  uid: string;
  category: string;
  topic: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: string;
  noOfModules: number;
  language: string;
  userInstructions?: string;
  promptMode?: CoursePromptMode;
}

export interface CourseQueryParams {
  level?: "beginner" | "intermediate" | "advanced";
  uid?: string;
  publish?: boolean;
  draft?: boolean;
  search?: string;
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

export interface CourseValidationResponse {
  isComplete: boolean;
  missingComponents: string[];
  details: {
    hasModules: boolean;
    modulesCount: number;
    hasChapters: boolean;
    chaptersCount: number;
    hasLessons: boolean;
    lessonsCount: number;
    capstoneProject?: boolean;
  };
}

export const courseSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    subtitle: { type: "string" },
    description: { type: "string" },
    category: { type: "string" },
    topic: { type: "string" },
    level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
    language: { type: "string" },
    prerequisites: { type: "string" },
    learning_outcomes: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 8,
    },
    publish: { type: "boolean" },
    draft: { type: "boolean" },
    duration: { type: "string" },
    noOfModules: { type: "integer" },
    targetAudience: { type: "string" },
    skillsGained: {
      type: "array",
      items: { type: "string" },
    },
    supportsCodePlayground: { type: "boolean" },
  },
  required: ["name", "description", "learning_outcomes", "prerequisites"],
};
