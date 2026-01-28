/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { AppError } from "../../utils/errors";
import { config } from "../../config/environment";
import { CodePlaygroundRepository } from "./repository";
import type {
  CodeWorkspace,
  ExecutionRequest,
  ExecutionResult,
  Judge0ResultResponse,
  Judge0SubmissionRequest,
  SaveWorkspaceRequest,
} from "./types";
import { LANGUAGE_MAP, SUPPORTED_LANGUAGES } from "./types";
import { logger } from "@utils/loggers";

export class CodePlaygroundService {
  private repository: CodePlaygroundRepository;
  private judge0ApiUrl: string;
  private judge0ApiKey: string;
  private pistonApiUrl: string;

  constructor(repository: CodePlaygroundRepository) {
    this.repository = repository;

    this.judge0ApiUrl = config.codeExecution.judge0.apiUrl;
    this.judge0ApiKey = config.codeExecution.judge0.apiKey;
    this.pistonApiUrl = config.codeExecution.piston.apiUrl;

    if (!this.judge0ApiKey && this.judge0ApiUrl.includes("rapidapi")) {
      logger.warn(
        "JUDGE0_API_KEY not set. Judge0 via RapidAPI will not work. Use self-hosted Judge0 or Piston instead.",
      );
    }

    logger.info(
      `Code Execution: Piston=${this.pistonApiUrl}, Judge0=${this.judge0ApiUrl}`,
    );
  }

  async pistonGetLanguages(): Promise<string[]> {
    try {
      const response = await axios.get<any>(`${this.pistonApiUrl}/runtimes`, {
        timeout: config.codeExecution.piston.timeout,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new AppError(`Code execution failed: ${error.message}`, 500);
      }
      throw error;
    }
  }

  async pistonExecuteCode({
    language,
    sourceCode,
    version,
    stdin,
  }: {
    language: string;
    sourceCode: string;
    version?: string;
    stdin?: string;
  }): Promise<any> {
    try {
      const pistonLanguage = language.toLowerCase();

      const requestBody: any = {
        language: pistonLanguage,
        version: version || "*",
        files: [
          {
            name: `main.${this.getFileExtension(pistonLanguage)}`,
            content: sourceCode,
          },
        ],
      };

      if (stdin) {
        requestBody.stdin = stdin;
      }

      const response = await axios.post<any>(
        `${this.pistonApiUrl}/execute`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.codeExecution.piston.timeout,
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new AppError(`Piston execution failed: ${errorMessage}`, 500);
      }
      throw error;
    }
  }

  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      "c++": "cpp",
      cpp: "cpp",
      c: "c",
      csharp: "cs",
      go: "go",
      rust: "rs",
      php: "php",
      ruby: "rb",
      swift: "swift",
      kotlin: "kt",
      r: "r",
      bash: "sh",
    };
    return extensions[language] || "txt";
  }

  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    const { code, language, stdin, engine = "piston" } = request;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      throw new AppError(
        `Unsupported language: ${language}. Supported languages: ${SUPPORTED_LANGUAGES.join(
          ", ",
        )}`,
        400,
      );
    }

    if (engine === "judge0") {
      return this.executeCodeWithJudge0({ code, language, stdin });
    }

    return this.executeCodeWithPiston({ code, language, stdin });
  }

  private async executeCodeWithPiston({
    code,
    language,
    stdin,
  }: {
    code: string;
    language: string;
    stdin?: string;
  }): Promise<ExecutionResult> {
    try {
      const result = await this.pistonExecuteCode({
        language,
        sourceCode: code,
        stdin,
      });

      const stdout = result.run?.stdout || "";
      const stderr = result.run?.stderr || "";
      const compileOutput =
        result.compile?.stderr || result.compile?.stdout || "";

      const hasError = result.run?.code !== 0 || stderr;

      return {
        stdout,
        stderr,
        status: {
          id: hasError ? 6 : 3,
          description: hasError ? "Runtime Error" : "Accepted",
        },
        time: "0",
        memory: 0,
        compile_output: compileOutput || undefined,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Code execution failed", 500);
    }
  }

  private async executeCodeWithJudge0({
    code,
    language,
    stdin,
  }: {
    code: string;
    language: string;
    stdin?: string;
  }): Promise<ExecutionResult> {
    const languageId = LANGUAGE_MAP[language];

    if (!languageId) {
      throw new AppError(`Language ID not found for: ${language}`, 400);
    }

    if (!this.judge0ApiKey) {
      throw new AppError(
        "Judge0 API key not configured. Please use Piston engine or configure Judge0.",
        500,
      );
    }

    try {
      const submissionData: Judge0SubmissionRequest = {
        source_code: Buffer.from(code).toString("base64"),
        language_id: languageId,
        stdin: stdin ? Buffer.from(stdin).toString("base64") : undefined,
      };

      const response = await axios.post<Judge0ResultResponse>(
        `${this.judge0ApiUrl}/submissions?base64_encoded=true&wait=true`,
        submissionData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": this.judge0ApiKey,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
          timeout: config.codeExecution.judge0.timeout,
        },
      );

      const result = response.data;

      const stdout = result.stdout
        ? Buffer.from(result.stdout, "base64").toString()
        : "";
      const stderr = result.stderr
        ? Buffer.from(result.stderr, "base64").toString()
        : "";
      const compileOutput = result.compile_output
        ? Buffer.from(result.compile_output, "base64").toString()
        : undefined;

      return {
        stdout,
        stderr,
        status: result.status,
        time: result.time || "0",
        memory: result.memory || 0,
        compile_output: compileOutput,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new AppError(`Judge0 execution failed: ${errorMessage}`, 500);
      }
      throw error;
    }
  }

  async saveWorkspace(request: SaveWorkspaceRequest): Promise<CodeWorkspace> {
    if (!SUPPORTED_LANGUAGES.includes(request.language)) {
      throw new AppError(`Unsupported language: ${request.language}`, 400);
    }

    const existing = await this.repository.getWorkspaceByUserAndLesson(
      request.userId,
      request.lessonId,
    );

    if (existing) {
      return this.repository.saveWorkspace(request, existing.id);
    }

    return this.repository.saveWorkspace(request);
  }

  async getWorkspace(
    userId: string,
    lessonId: string,
  ): Promise<CodeWorkspace | null> {
    return this.repository.getWorkspaceByUserAndLesson(userId, lessonId);
  }

  async getWorkspacesByCourse(
    userId: string,
    courseId: string,
  ): Promise<CodeWorkspace[]> {
    return this.repository.getWorkspacesByCourse(userId, courseId);
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.repository.getWorkspace(workspaceId);

    if (!workspace) {
      throw new AppError("Workspace not found", 404);
    }

    if (workspace.userId !== userId) {
      throw new AppError(
        "You do not have permission to delete this workspace",
        403,
      );
    }

    await this.repository.deleteWorkspace(workspaceId);
  }

  async executeAndSave(
    request: ExecutionRequest,
  ): Promise<{ result: ExecutionResult; workspace: CodeWorkspace }> {
    const startTime = Date.now();

    const result = await this.executeCode(request);

    const executionTime = Date.now() - startTime;

    const workspace = await this.saveWorkspace({
      userId: request.userId,
      lessonId: request.lessonId,
      courseId: "",
      code: request.code,
      language: request.language,
    });

    await this.repository.updateLastRun(workspace.id, {
      output: result.stdout || result.stderr,
      error: result.stderr || result.compile_output,
      executionTime,
      status: result.status.id === 3 ? "success" : "error",
    });

    return { result, workspace };
  }
}
