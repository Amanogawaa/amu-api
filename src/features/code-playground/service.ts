import axios from 'axios';
import type {
  ExecutionRequest,
  ExecutionResult,
  Judge0SubmissionRequest,
  Judge0SubmissionResponse,
  Judge0ResultResponse,
  SaveWorkspaceRequest,
  CodeWorkspace,
} from './types';
import { LANGUAGE_MAP, SUPPORTED_LANGUAGES } from './types';
import { CodePlaygroundRepository } from './repository';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/loggers';

export class CodePlaygroundService {
  private repository: CodePlaygroundRepository;
  private judge0ApiUrl: string;
  private judge0ApiKey: string;

  constructor(repository: CodePlaygroundRepository) {
    this.repository = repository;
    this.judge0ApiUrl =
      process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
    this.judge0ApiKey = process.env.JUDGE0_API_KEY || '';

    if (!this.judge0ApiKey) {
      console.warn('JUDGE0_API_KEY not set. Code execution will not work.');
    }
  }

  async pistonGetLanguages(): Promise<string[]> {
    try {
      const response = await axios.get<any>(
        'https://emkc.org/api/v2/piston/runtimes'
      );
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
  }: {
    language: string;
    sourceCode: string;
    version?: string;
  }) {
    try {
      const response = await axios.post<any>(
        'https://emkc.org/api/v2/piston/execute',
        {
          language,
          version,
          files: [
            {
              content: sourceCode,
            },
          ],
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new AppError(`Code execution failed: ${error.message}`, 500);
      }
      throw error;
    }
  }

  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    const { code, language, stdin } = request;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      throw new AppError(
        `Unsupported language: ${language}. Supported languages: ${SUPPORTED_LANGUAGES.join(
          ', '
        )}`,
        400
      );
    }

    const languageId = LANGUAGE_MAP[language];

    if (!languageId) {
      throw new AppError(`Language ID not found for: ${language}`, 400);
    }

    try {
      const submissionData: Judge0SubmissionRequest = {
        source_code: Buffer.from(code).toString('base64'),
        language_id: languageId,
        stdin: stdin ? Buffer.from(stdin).toString('base64') : undefined,
      };

      const response = await axios.post<Judge0ResultResponse>(
        `${this.judge0ApiUrl}/submissions?base64_encoded=true&wait=true`,
        submissionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.judge0ApiKey,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          },
        }
      );

      const result = response.data;

      const stdout = result.stdout
        ? Buffer.from(result.stdout, 'base64').toString()
        : '';
      const stderr = result.stderr
        ? Buffer.from(result.stderr, 'base64').toString()
        : '';
      const compileOutput = result.compile_output
        ? Buffer.from(result.compile_output, 'base64').toString()
        : undefined;

      return {
        stdout,
        stderr,
        status: result.status,
        time: result.time || '0',
        memory: result.memory || 0,
        compile_output: compileOutput,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new AppError(`Code execution failed: ${error.message}`, 500);
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
      request.lessonId
    );

    if (existing) {
      return this.repository.saveWorkspace(request, existing.id);
    }

    return this.repository.saveWorkspace(request);
  }

  async getWorkspace(
    userId: string,
    lessonId: string
  ): Promise<CodeWorkspace | null> {
    return this.repository.getWorkspaceByUserAndLesson(userId, lessonId);
  }

  async getWorkspacesByCourse(
    userId: string,
    courseId: string
  ): Promise<CodeWorkspace[]> {
    return this.repository.getWorkspacesByCourse(userId, courseId);
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.repository.getWorkspace(workspaceId);

    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    if (workspace.userId !== userId) {
      throw new AppError(
        'You do not have permission to delete this workspace',
        403
      );
    }

    await this.repository.deleteWorkspace(workspaceId);
  }

  async executeAndSave(
    request: ExecutionRequest
  ): Promise<{ result: ExecutionResult; workspace: CodeWorkspace }> {
    const startTime = Date.now();

    const result = await this.executeCode(request);

    const executionTime = Date.now() - startTime;

    const workspace = await this.saveWorkspace({
      userId: request.userId,
      lessonId: request.lessonId,
      courseId: '',
      code: request.code,
      language: request.language,
    });

    await this.repository.updateLastRun(workspace.id, {
      output: result.stdout || result.stderr,
      error: result.stderr || result.compile_output,
      executionTime,
      status: result.status.id === 3 ? 'success' : 'error',
    });

    return { result, workspace };
  }
}
