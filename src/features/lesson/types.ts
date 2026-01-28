import type { PromptMode } from "../../utils/prompts/types";

export type PlaygroundType = "vanilla" | "frontend" | "backend" | "none";

export interface PlaygroundEnvironment {
  type: PlaygroundType;
  framework?: string;
  dependencies?: string[];
  supportsExecution: boolean;
  executionEngine?: "piston" | "judge0" | "sandpack" | "none";
  config?: {
    template?: string;
    files?: Record<string, string>;
    buildCommand?: string;
    runCommand?: string;
  };
}

export interface Lesson {
  id: string;
  chapterId: string;
  lessonOrder: number;
  lessonName: string;
  type: "video" | "article" | "quiz";
  duration: string;
  lessonDescription: string;
  content: string | null;
  videoSearchQuery: string | null;
  selectedVideoId?: string;
  videoTranscript?: string | null;
  transcriptLanguage?: string;
  transcriptFetchedAt?: string;
  resources: LessonResource[];
  learningOutcome: string;
  prerequisites: string[];

  // Phase 1: Adaptive Playground Environment
  playgroundEnvironment?: PlaygroundEnvironment;
}

export interface LessonResource {
  title: string;
  url: string;
  type: "documentation" | "article" | "tool" | "github" | "reference";
  description: string;
}

export interface GenerateLessonRequest {
  chapterId: string;
  chapterName: string;
  chapterDescription: string;
  chapterOrder: number;
  learningObjectives: string[];
  keyTopics: string[];
  estimatedDuration: string;
  courseName: string;
  level: string;
  language: string;
  userInstructions?: string;
  promptMode?: PromptMode;
}

export interface LessonResponse {
  data: Lesson | Lesson[];
  message: string;
  total?: number;
}

export interface UpdateLessonRequest {
  lessonOrder?: number;
  lessonName?: string;
  type?: "video" | "article" | "quiz";
  duration?: string;
  lessonDescription?: string;
  content?: string | null;
  videoSearchQuery?: string | null;
  selectedVideoId?: string;
  videoTranscript?: string | null;
  transcriptLanguage?: string;
  transcriptFetchedAt?: string;
  resources?: LessonResource[];
  learningOutcome?: string;
  prerequisites?: string[];
}

export const lessonsSchema = {
  type: "object",
  properties: {
    lessons: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lessonOrder: { type: "integer", minimum: 1 },
          lessonName: { type: "string" },
          type: {
            type: "string",
            enum: ["video", "article", "quiz", "exercise"],
          },
          duration: { type: "string", pattern: "^\\d+m$" },
          lessonDescription: { type: "string" },
          content: {
            type: ["string", "null"],
            minLength: 100,
          },
          videoSearchQuery: { type: ["string", "null"] },
          resources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                url: { type: "string" },
                type: {
                  type: "string",
                  enum: [
                    "documentation",
                    "article",
                    "tool",
                    "github",
                    "video",
                    "interactive",
                  ],
                },
                description: { type: "string" },
              },
              required: ["title", "url", "type"],
            },
          },
          learningOutcome: { type: "string" },
          prerequisites: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "lessonOrder",
          "lessonName",
          "type",
          "duration",
          "lessonDescription",
          "content",
          "videoSearchQuery",
          "resources",
          "learningOutcome",
          "prerequisites",
        ],
      },
    },
  },
  required: ["lessons"],
};
