import { type NextFunction, type Request, type Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { logger } from "../../core/utils/loggers";
import type { GitHubService } from "./service";

export class GitHubController {
  private service: GitHubService;

  constructor(service: GitHubService) {
    this.service = service;
  }

  /**
   * Get repository tree structure
   * GET /github/repos/:owner/:repo/tree
   */
  getRepoTree = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { owner, repo } = request.params;
      const { ref } = request.query;

      if (!owner || !repo) {
        response.status(400).json({
          message: "Owner and repository name are required",
        });
        return;
      }

      // Get access token from authenticated user if available
      const accessToken = (request as AuthenticatedRequest).user?.githubToken;

      const tree = await this.service.getRepoTree(
        owner,
        repo,
        (ref as string) || "HEAD",
        accessToken,
      );

      response.status(200).json({
        data: tree,
        message: "Repository tree fetched successfully",
      });
    } catch (error) {
      logger.error("Error in GitHubController.getRepoTree:", error);
      next(error);
    }
  };

  /**
   * Get repository contents (file or directory)
   * GET /github/repos/:owner/:repo/contents
   */
  getRepoContents = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { owner, repo } = request.params;
      const { path, ref } = request.query;

      if (!owner || !repo) {
        response.status(400).json({
          message: "Owner and repository name are required",
        });
        return;
      }

      // Get access token from authenticated user if available
      const accessToken = (request as AuthenticatedRequest).user?.githubToken;

      const contents = await this.service.getRepoContents(
        owner,
        repo,
        (path as string) || "",
        (ref as string) || "HEAD",
        accessToken,
      );

      response.status(200).json({
        data: contents,
        message: "Repository contents fetched successfully",
      });
    } catch (error) {
      logger.error("Error in GitHubController.getRepoContents:", error);
      next(error);
    }
  };

  /**
   * Get file content (decoded)
   * GET /github/repos/:owner/:repo/files/:path
   */
  getFileContent = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { owner, repo } = request.params;
      const { path, ref } = request.query;

      if (!owner || !repo) {
        response.status(400).json({
          message: "Owner and repository name are required",
        });
        return;
      }

      if (!path || typeof path !== "string") {
        response.status(400).json({
          message: "File path is required as a query parameter",
        });
        return;
      }

      // Get access token from authenticated user if available
      const accessToken = (request as AuthenticatedRequest).user?.githubToken;

      const fileContent = await this.service.getFileContent(
        owner,
        repo,
        path,
        (ref as string) || "HEAD",
        accessToken,
      );

      response.status(200).json({
        data: fileContent,
        message: "File content fetched successfully",
      });
    } catch (error) {
      logger.error("Error in GitHubController.getFileContent:", error);
      next(error);
    }
  };

  /**
   * Get repository branches
   * GET /github/repos/:owner/:repo/branches
   */
  getBranches = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { owner, repo } = request.params;

      if (!owner || !repo) {
        response.status(400).json({
          message: "Owner and repository name are required",
        });
        return;
      }

      // Get access token from authenticated user if available
      const accessToken = (request as AuthenticatedRequest).user?.githubToken;

      const branches = await this.service.getBranches(owner, repo, accessToken);

      response.status(200).json({
        data: branches,
        message: "Repository branches fetched successfully",
      });
    } catch (error) {
      logger.error("Error in GitHubController.getBranches:", error);
      next(error);
    }
  };
}
