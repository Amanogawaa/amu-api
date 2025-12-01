export interface Module {
  id: string;
  courseId: string;
  courseName: string;
  moduleOrder: number;
  moduleName: string;
  moduleDescription: string;
  estimatedDuration: string;
  estimatedChapterCount?: number;
  learningObjectives: string[];
  keySkills?: string[];
  prerequisiteModules?: string[];
  level: "beginner" | "intermediate" | "advanced";
  language: string;
  createdAt?: Date;
  updatedAt?: Date;
}

import type { PromptMode } from "../../utils/prompts/types";

export interface GenerateModulesRequest {
  courseId: string;
  courseName: string;
  courseDescription: string;
  learningOutcomes: string[];
  level: "beginner" | "intermediate" | "advanced";
  duration: string;
  noOfModules: number;
  language: string;
  prerequisites: string;
  userInstructions?: string;
  promptMode?: PromptMode;
}

export interface UpdateModuleRequest extends GenerateModulesRequest {
  keepExistingIds?: boolean;
}

export interface ModuleQueryParams {
  courseId?: string;
  limit?: number;
  offset?: number;
}

export interface ModuleResponse {
  data: Module | Module[];
  message: string;
  total?: number;
}

export const modulesSchema = {
  type: "object",
  properties: {
    modules: {
      type: "array",
      items: {
        type: "object",
        properties: {
          moduleOrder: { type: "integer", minimum: 1 },
          moduleName: { type: "string", minLength: 5, maxLength: 100 },
          moduleDescription: { type: "string", minLength: 50, maxLength: 500 },
          estimatedDuration: {
            type: "string",
            pattern: "^\\d+h( \\d+m)?$|^\\d+m$", // e.g., "6h 30m" or "45m"
          },
          estimatedChapterCount: { type: "integer", minimum: 3, maximum: 8 },
          learningObjectives: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 5,
          },
          keySkills: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
          },
          prerequisiteModules: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "moduleOrder",
          "moduleName",
          "moduleDescription",
          "estimatedDuration",
          "learningObjectives",
          "estimatedChapterCount",
          "keySkills",
          "prerequisiteModules",
        ],
      },
    },
  },
  required: ["modules"],
};
