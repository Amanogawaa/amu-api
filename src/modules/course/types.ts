import type { PromptMode } from "../../core/ai/prompts/types";

export interface Course {
  _id: string;
  userId: string;
  topic: string;
  level: string;
  duration: string;
  category: string;
  language: string;
  name: string;
  description: string;
  subtitle?: string;
  targetAudience: string;
  prerequisites: string;
  noOfChapters: number;
  skillsGained: string[];
  learning_outcomes: string[];
  publish: boolean;
  draft: boolean;
  supportsCodePlayground?: boolean;
  tags?: string[];
  nextCourses?: string[];
}

export type CoursePromptMode = PromptMode;

export interface GenerateCourseRequest {
  uid: string;
  category: string;
  topic: string;
  level: string;
  duration: string;
  noOfChapters: number;
  language: string;
  userInstructions?: string;
  promptMode?: CoursePromptMode;
}

export interface CourseQueryParams {
  category?: string;
  level?: "beginner" | "intermediate" | "advanced";
  publishedOnly?: boolean;
  draft?: boolean;
  limit?: number;
}

export interface CourseWithStats extends Course {
  chapters?: number;
  enrollmentCount?: number;
  commentsCount?: number;
  likesCount?: number;
}

export interface CourseValidationResponse {
  isComplete: boolean;
  missingComponents: string[];
  details: {
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
    tags: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 8,
    },
    publish: { type: "boolean" },
    draft: { type: "boolean" },
    duration: { type: "string" },
    noOfChapters: { type: "integer" },
    targetAudience: { type: "string" },
    skillsGained: {
      type: "array",
      items: { type: "string" },
    },
    supportsCodePlayground: { type: "boolean" },
  },
  required: ["name", "description", "learning_outcomes", "prerequisites"],
};
