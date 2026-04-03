import type { PromptMode } from "../../utils/prompts/types";

export interface Course {
  id: string;
  uid: string;

  topic: string;
  level: "beginner" | "intermediate" | "advanced";
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

  likesCount?: number;
  commentsCount?: number;

  enrollmentCount?: number;
  isEnrolled?: boolean;

  tags?: string[];
  nextCourses?: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export type CoursePromptMode = PromptMode;

export interface GenerateCourseRequest {
  uid: string;
  category: string;
  topic: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: string;
  noOfChapters: number;
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
  fields?: string[];
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
