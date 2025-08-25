import { Router, type Request, type Response } from 'express';
import type { CourseController } from './controller';

export class CourseRoute {
  public router: Router;
  private controller: CourseController;

  constructor(controller: CourseController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      '/courses',
      this.controller.getCourses.bind(this.controller)
    );

    this.router.post(
      '/courses',
      this.controller.generateCourse.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
