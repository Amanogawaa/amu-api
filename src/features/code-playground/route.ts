import { Router } from 'express';
import type { CodePlaygroundController } from './controller';
import { validateExecuteCode, validateSaveWorkspace } from './validation';
import { authMiddleware } from '../../middlewares/auth.middleware';

export class CodePlaygroundRoute {
  public router: Router;
  private controller: CodePlaygroundController;

  constructor(controller: CodePlaygroundController) {
    this.controller = controller;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      'code/execute',
      validateExecuteCode,
      this.controller.executeCode
    );

    this.router.post(
      'code/execute-and-save',
      validateExecuteCode,
      this.controller.executeAndSave
    );

    this.router.post(
      'code/workspace',
      validateSaveWorkspace,
      this.controller.saveWorkspace
    );

    this.router.get('code/workspace/:lessonId', this.controller.getWorkspace);

    this.router.get(
      'code/workspaces/course/:courseId',
      this.controller.getWorkspacesByCourse
    );

    this.router.delete(
      'code/workspace/:workspaceId',
      this.controller.deleteWorkspace
    );

    /**
     * @openapi
     * /languages:
     *   get:
     *     tags: [Code Playground]
     *     summary: Get supported programming languages
     *     description: Retrieve a list of programming languages supported by the code execution service
     *     responses:
     *       200:
     *        description: A list of supported programming languages
     *       content:
     *        application/json:
     *         schema:
     *          type: object
     *          properties:
     *
     */
    this.router.get(
      '/languages',
      authMiddleware,
      this.controller.getSupportedLanguages
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
