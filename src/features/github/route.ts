import { Router } from 'express';
import type { GitHubController } from './controller';

export class GitHubRoute {
  public router: Router;
  private controller: GitHubController;

  constructor(controller: GitHubController) {
    this.controller = controller;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /github/repos/{owner}/{repo}/tree:
     *   get:
     *     tags:
     *       - GitHub
     *     summary: Get repository tree structure
     *     description: Fetches the complete file and folder tree structure of a GitHub repository
     *     parameters:
     *       - in: path
     *         name: owner
     *         required: true
     *         schema:
     *           type: string
     *         description: Repository owner username
     *       - in: path
     *         name: repo
     *         required: true
     *         schema:
     *           type: string
     *         description: Repository name
     *       - in: query
     *         name: ref
     *         schema:
     *           type: string
     *         description: "Branch, tag, or commit SHA (default: HEAD)"
     *     responses:
     *       200:
     *         description: Repository tree fetched successfully
     *       404:
     *         description: Repository not found
     *       403:
     *         description: Access denied
     */
    this.router.get(
      '/repos/:owner/:repo/tree',
      this.controller.getRepoTree
    );

    /**
     * @openapi
     * /github/repos/{owner}/{repo}/contents:
     *   get:
     *     tags:
     *       - GitHub
     *     summary: Get repository contents
     *     description: Fetches contents of a specific path (file or directory) in the repository
     *     parameters:
     *       - in: path
     *         name: owner
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: repo
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: path
     *         schema:
     *           type: string
     *         description: Path to file or directory (empty for root)
     *       - in: query
     *         name: ref
     *         schema:
     *           type: string
     *         description: Branch, tag, or commit SHA
     *     responses:
     *       200:
     *         description: Contents fetched successfully
     *       404:
     *         description: Path not found
     */
    this.router.get(
      '/repos/:owner/:repo/contents',
      this.controller.getRepoContents
    );

    /**
     * @openapi
     * /github/repos/{owner}/{repo}/file:
     *   get:
     *     tags:
     *       - GitHub
     *     summary: Get file content
     *     description: Fetches and decodes the content of a specific file
     *     parameters:
     *       - in: path
     *         name: owner
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: repo
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: path
     *         required: true
     *         schema:
     *           type: string
     *         description: Path to the file (e.g., "src/index.ts" or "package.json")
     *       - in: query
     *         name: ref
     *         schema:
     *           type: string
     *         description: Branch, tag, or commit SHA
     *     responses:
     *       200:
     *         description: File content fetched successfully
     *       400:
     *         description: Path is a directory, not a file, or path parameter missing
     *       404:
     *         description: File not found
     */
    // Use query parameter for file path to handle paths with slashes
    this.router.get(
      '/repos/:owner/:repo/file',
      this.controller.getFileContent
    );

    /**
     * @openapi
     * /github/repos/{owner}/{repo}/branches:
     *   get:
     *     tags:
     *       - GitHub
     *     summary: Get repository branches
     *     description: Fetches all branches of a repository
     *     parameters:
     *       - in: path
     *         name: owner
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: repo
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Branches fetched successfully
     *       404:
     *         description: Repository not found
     */
    this.router.get(
      '/repos/:owner/:repo/branches',
      this.controller.getBranches
    );
  }

  getRouter(): Router {
    return this.router;
  }
}

