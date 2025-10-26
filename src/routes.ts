import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { AuthContainer } from './features/auth/container';
import { CourseContainer } from './features/course/container';
import type { ChapterContainer } from './features/chapter/container';

export class AppRoutes {
  private router: Router;
  private authContainer: AuthContainer;
  private courseContainer: CourseContainer;
  private chapterContainer: ChapterContainer;

  constructor(
    authContainer: AuthContainer,
    courseContainer: CourseContainer,
    chapterContainer: ChapterContainer
  ) {
    this.router = Router();
    this.courseContainer = courseContainer;
    this.authContainer = authContainer;
    this.chapterContainer = chapterContainer;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use('/', this.authContainer.getRouter());
    this.router.use('/', this.courseContainer.getRouter());
    this.router.use('/', this.chapterContainer.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
