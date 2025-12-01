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

export interface ExecutionRequest {
  code: string;
  language: string;
  stdin?: string;
  lessonId: string;
  userId: string;
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

export const LANGUAGE_MAP: Record<string, number> = {
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
