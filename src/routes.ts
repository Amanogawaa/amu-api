import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { AuthContainer } from './features/auth/container';
import { CourseContainer } from './features/course/container';
import type { ChapterContainer } from './features/chapter/container';
import type { LessonContainer } from './features/lesson/container';
import type { ModuleContainer } from './features/modules/container';

export class AppRoutes {
  private router: Router;
  private authContainer: AuthContainer;
  private courseContainer: CourseContainer;
  private chapterContainer: ChapterContainer;
  private lessonContainer: LessonContainer;
  private moduleContainer: ModuleContainer;

  constructor(
    authContainer: AuthContainer,
    courseContainer: CourseContainer,
    chapterContainer: ChapterContainer,
    lessonContainer: LessonContainer,
    moduleContainer: ModuleContainer
  ) {
    this.router = Router();
    this.courseContainer = courseContainer;
    this.authContainer = authContainer;
    this.chapterContainer = chapterContainer;
    this.lessonContainer = lessonContainer;
    this.moduleContainer = moduleContainer;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use('/', this.authContainer.getRouter());
    this.router.use('/', this.courseContainer.getRouter());
    this.router.use('/', this.chapterContainer.getRouter());
    // this.router.use('/', this.lessonContainer.getRouter());
    this.router.use('/', this.moduleContainer.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
