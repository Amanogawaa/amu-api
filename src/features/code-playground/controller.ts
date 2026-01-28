import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import type { CodePlaygroundService } from "./service";
import type { ExecutionRequest, SaveWorkspaceRequest } from "./types";

export class CodePlaygroundController {
  private codePlaygroundService: CodePlaygroundService;
  constructor(codePlaygroundService: CodePlaygroundService) {
    this.codePlaygroundService = codePlaygroundService;
  }

  executeCode = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { code, language, stdin, lessonId } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const request: ExecutionRequest = {
        code,
        language,
        stdin,
        lessonId,
        userId,
      };

      const result = await this.codePlaygroundService.executeCode(request);

      res.status(200).json({
        success: true,
        data: result,
        message: "Code executed successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  executeAndSave = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { code, language, stdin, lessonId } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const request: ExecutionRequest = {
        code,
        language,
        stdin,
        lessonId,
        userId,
      };

      const { result, workspace } =
        await this.codePlaygroundService.executeAndSave(request);

      res.status(200).json({
        success: true,
        data: {
          result,
          workspace,
        },
        message: "Code executed and saved successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  saveWorkspace = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { lessonId, courseId, code, language } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const request: SaveWorkspaceRequest = {
        userId,
        lessonId,
        courseId,
        code,
        language,
      };

      const workspace = await this.codePlaygroundService.saveWorkspace(request);

      res.status(200).json({
        success: true,
        data: workspace,
        message: "Workspace saved successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getPistonSupportedLanguages = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const languages = await this.codePlaygroundService.pistonGetLanguages();

      res.status(200).json({
        success: true,
        data: languages,
        message: "Supported languages retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  pistonExecuteCode = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { language, version, code } = req.body;

      const result = await this.codePlaygroundService.pistonExecuteCode({
        language: language,
        version: version,
        sourceCode: code,
      });

      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  judge0ExecuteCode = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { code, language, stdin, lessonId } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const request: ExecutionRequest = {
        code,
        language,
        stdin,
        lessonId,
        userId,
        engine: "judge0", // Explicitly use Judge0
      };

      const result = await this.codePlaygroundService.executeCode(request);

      res.status(200).json({
        success: true,
        data: result,
        message: "Code executed successfully with Judge0",
      });
    } catch (error) {
      next(error);
    }
  };

  getJudge0SupportedLanguages = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { JUDGE0_LANGUAGE_MAP } = await import("./types");

      const languages = Object.keys(JUDGE0_LANGUAGE_MAP).map((key) => ({
        name: key,
        id: JUDGE0_LANGUAGE_MAP[key],
      }));

      res.status(200).json({
        success: true,
        data: languages,
        message: "Judge0 supported languages retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getWorkspace = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { lessonId } = req.params;
      const userId = req.user?.uid;

      if (!userId || !lessonId) {
        res.status(401).json({ message: "Unauthorized or missing lesson ID" });
        return;
      }

      const workspace = await this.codePlaygroundService.getWorkspace(
        userId,
        lessonId,
      );

      if (!workspace) {
        res.status(404).json({
          success: false,
          message: "Workspace not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: workspace,
        message: "Workspace retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getWorkspacesByCourse = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;
      const userId = req.user?.uid;

      if (!userId || !courseId) {
        res.status(401).json({ message: "Unauthorized or missing course ID" });
        return;
      }

      const workspaces = await this.codePlaygroundService.getWorkspacesByCourse(
        userId,
        courseId,
      );

      res.status(200).json({
        success: true,
        data: workspaces,
        total: workspaces.length,
        message: "Workspaces retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  deleteWorkspace = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user?.uid;

      if (!userId || !workspaceId) {
        res
          .status(401)
          .json({ message: "Unauthorized or missing workspace ID" });
        return;
      }

      await this.codePlaygroundService.deleteWorkspace(workspaceId, userId);

      res.status(200).json({
        success: true,
        message: "Workspace deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  async getSupportedLanguages(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { SUPPORTED_LANGUAGES } = await import("./types");

    res.status(200).json({
      success: true,
      data: SUPPORTED_LANGUAGES,
      message: "Supported languages retrieved successfully",
    });
  }
}
