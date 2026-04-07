import type { PromptMode } from "../../core/ai/prompts/types";

export interface LessonResource {
  title: string;
  url: string;
  type: string;
  description: string;
}

export interface Lesson {
  _id: string;
  chapterId: string;
  courseId: string;
  lessonOrder: number;
  lessonName: string;
  type: string;
  duration: string;
  lessonDescription: string;
  content?: string;
  videoSearchQuery?: string;
  selectedVideoId?: string;
  videoTranscript?: string;
  transcriptLanguage?: string;
  transcriptFetchedAt?: string;
  resources: LessonResource[];
  learningOutcome: string;
  prerequisites: string[];
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

export interface UpdateLessonDTO {
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
          playgroundEnvironment: {
            type: ["object", "null"],
            properties: {
              type: {
                type: "string",
                enum: ["vanilla", "frontend", "backend", "none"],
              },
              framework: { type: "string" },
              dependencies: {
                type: "array",
                items: { type: "string" },
              },
              supportsExecution: { type: "boolean" },
              executionEngine: {
                type: "string",
                enum: ["piston", "judge0", "sandpack", "none"],
              },
              config: {
                type: ["object", "null"],
                properties: {
                  template: { type: "string" },
                  starterCode: { type: "string" },
                  buildCommand: { type: "string" },
                  runCommand: { type: "string" },
                },
                additionalProperties: true,
              },
            },
            required: ["type", "supportsExecution"],
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
