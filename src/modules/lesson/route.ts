import { Router, type Request, type Response } from 'express';
import type { LessonController } from './controller';

export class LessonRoute {
  public router: Router;
  private controller: LessonController;

  constructor(controller: LessonController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      '/lessons/generate',
      this.controller.generateLessons.bind(this.controller)
    );

    this.router.get(
      '/lessons/chapter/:chapterId',
      this.controller.getLessonsByChapter.bind(this.controller)
    );

    this.router.get(
      '/lessons/:id',
      this.controller.getLessonById.bind(this.controller)
    );

    this.router.get(
      '/lessons/:id/resources',
      this.controller.getLessonResources.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
