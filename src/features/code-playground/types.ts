// ==================== EXERCISE GUIDELINES ====================
// Replace code playground with comprehensive exercise guidelines
// Users will use their own editors instead of the built-in playground

export interface ExerciseGuideline {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  objectives: string[];
  gettingStarted: {
    editorOptions: Array<{
      name: string;
      description: string;
      url: string;
      difficulty: "beginner" | "intermediate" | "advanced";
      pros: string[];
      cons: string[];
    }>;
    environmentSetup: string[];
    recommendedApproach: string;
  };
  problemStatement: {
    description: string;
    constraints: string[];
    acceptanceCriteria: string[];
  };
  technicalRequirements: {
    languages: string[];
    frameworks?: string[];
    tools: string[];
    runtime?: string;
  };
  solutionApproach: {
    steps: string[];
    pseudocode?: string;
    keyAlgorithms?: string[];
  };
  projectStructure: {
    description: string;
    fileStructure: Record<string, string>;
  };
  testingGuidelines: {
    whatToTest: string[];
    sampleTestCases?: Array<{
      input: string;
      expectedOutput: string;
    }>;
    testingTools: string[];
    bestPractices: string[];
  };
  commonMistakes: Array<{
    mistake: string;
    correction: string;
    prevention: string;
  }>;
  bestPractices: string[];
  resources: string[];
  examples: {
    description: string;
    links: string[];
  };
  estimatedTime: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  submissionGuidelines: {
    format: string;
    requiredFiles: string[];
    instructions: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export const exerciseGuidelineSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    lessonId: { type: "string" },
    courseId: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    objectives: { type: "array", items: { type: "string" } },
    gettingStarted: {
      type: "object",
      properties: {
        editorOptions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              url: { type: "string" },
              difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
              pros: { type: "array", items: { type: "string" } },
              cons: { type: "array", items: { type: "string" } }
            },
            required: ["name", "description", "url", "difficulty", "pros", "cons"]
          }
        },
        environmentSetup: { type: "array", items: { type: "string" } },
        recommendedApproach: { type: "string" }
      },
      required: ["editorOptions", "environmentSetup", "recommendedApproach"]
    },
    problemStatement: {
      type: "object",
      properties: {
        description: { type: "string" },
        constraints: { type: "array", items: { type: "string" } },
        acceptanceCriteria: { type: "array", items: { type: "string" } }
      },
      required: ["description", "constraints", "acceptanceCriteria"]
    },
    technicalRequirements: {
      type: "object",
      properties: {
        languages: { type: "array", items: { type: "string" } },
        frameworks: { type: "array", items: { type: "string" } },
        tools: { type: "array", items: { type: "string" } },
        runtime: { type: "string" }
      },
      required: ["languages", "tools"]
    },
    solutionApproach: {
      type: "object",
      properties: {
        steps: { type: "array", items: { type: "string" } },
        pseudocode: { type: "string" },
        keyAlgorithms: { type: "array", items: { type: "string" } }
      },
      required: ["steps"]
    },
    projectStructure: {
      type: "object",
      properties: {
        description: { type: "string" },
        fileStructure: { type: "object", additionalProperties: { type: "string" } }
      },
      required: ["description", "fileStructure"]
    },
    testingGuidelines: {
      type: "object",
      properties: {
        whatToTest: { type: "array", items: { type: "string" } },
        sampleTestCases: {
          type: "array",
          items: {
            type: "object",
            properties: {
              input: { type: "string" },
              expectedOutput: { type: "string" }
            },
            required: ["input", "expectedOutput"]
          }
        },
        testingTools: { type: "array", items: { type: "string" } },
        bestPractices: { type: "array", items: { type: "string" } }
      },
      required: ["whatToTest", "testingTools", "bestPractices"]
    },
    commonMistakes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          mistake: { type: "string" },
          correction: { type: "string" },
          prevention: { type: "string" }
        },
        required: ["mistake", "correction", "prevention"]
      }
    },
    bestPractices: { type: "array", items: { type: "string" } },
    resources: { type: "array", items: { type: "string" } },
    examples: {
      type: "object",
      properties: {
        description: { type: "string" },
        links: { type: "array", items: { type: "string" } }
      },
      required: ["description", "links"]
    },
    estimatedTime: { type: "string" },
    difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
    submissionGuidelines: {
      type: "object",
      properties: {
        format: { type: "string" },
        requiredFiles: { type: "array", items: { type: "string" } },
        instructions: { type: "array", items: { type: "string" } }
      },
      required: ["format", "requiredFiles", "instructions"]
    }
  },
  required: [
    "id", "lessonId", "courseId", "title", "description", "objectives",
    "gettingStarted", "problemStatement", "technicalRequirements",
    "solutionApproach", "projectStructure", "testingGuidelines",
    "commonMistakes", "bestPractices", "resources", "examples",
    "estimatedTime", "difficulty", "submissionGuidelines"
  ]
};

export interface SaveExerciseRequest {
  lessonId: string;
  courseId: string;
  code: string;
  language: string;
}

export interface ExerciseSubmission {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  code: string;
  language: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== DEPRECATED: CODE WORKSPACE ====================
// The following interfaces are deprecated and will be removed.
// Use ExerciseGuideline instead for new implementations.

export interface CodeWorkspace {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  code: string;
  language: string;
  lastRun?: {
    timestamp: Date;
    output: string;
    error?: string;
    executionTime: number;
    status: "success" | "error" | "timeout";
  };
  createdAt: Date;
  updatedAt: Date;
}

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

export interface ExecutionRequest {
  code: string;
  language: string;
  stdin?: string;
  lessonId: string;
  userId: string;
  engine?: "piston" | "judge0";
}

export interface PistonExecutionRequest {
  language: string;
  version?: string;
  files: {
    name?: string;
    content: string;
  }[];
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_memory_limit?: number;
  run_memory_limit?: number;
}

export interface PistonExecutionResult {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
}

export interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
  runtime?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number;
  compile_output?: string;
}

export interface SaveWorkspaceRequest {
  lessonId: string;
  userId: string;
  courseId: string;
  code: string;
  language: string;
}

export interface WorkspaceResponse {
  data: CodeWorkspace | CodeWorkspace[];
  message: string;
}

export const JUDGE0_LANGUAGE_MAP: Record<string, number> = {
  javascript: 63, // Node.js
  typescript: 74, // TypeScript
  python: 71, // Python 3
  java: 62, // Java
  cpp: 54, // C++ (GCC 9.2.0)
  c: 50, // C (GCC 9.2.0)
  csharp: 51, // C# (Mono)
  go: 60, // Go
  rust: 73, // Rust
  php: 68, // PHP
  ruby: 72, // Ruby
  swift: 83, // Swift
  kotlin: 78, // Kotlin
  r: 80, // R
  sql: 82, // SQL (SQLite)
  bash: 46, // Bash
};

// Piston Language Mappings (use language name directly)
export const PISTON_LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "c++",
  c: "c",
  csharp: "csharp",
  go: "go",
  rust: "rust",
  php: "php",
  ruby: "ruby",
  swift: "swift",
  kotlin: "kotlin",
  r: "r",
  bash: "bash",
};

export const LANGUAGE_MAP = JUDGE0_LANGUAGE_MAP;

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_MAP);

export interface Judge0SubmissionRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
}

export interface Judge0SubmissionResponse {
  token: string;
}

export interface Judge0ResultResponse {
  stdout: string | null;
  stderr: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
  compile_output: string | null;
}
