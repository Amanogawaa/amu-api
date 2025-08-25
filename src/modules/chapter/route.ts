import { Router } from 'express';
import { ChapterController } from './controller';

export class ChapterRoute {
  public router: Router;
  private controller: ChapterController;

  constructor(controller: ChapterController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // POST /chapters/generate - Generate chapters for a course
    this.router.post(
      '/chapters/generate',
      this.controller.generateChapters.bind(this.controller)
    );

    // GET /chapters/course/:courseId - Get chapters by course ID
    this.router.get(
      '/chapters/course/:courseId',
      this.controller.getChaptersByCourse.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
