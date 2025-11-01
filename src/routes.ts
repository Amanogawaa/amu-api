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
    this.authContainer = authContainer;
    this.courseContainer = courseContainer;
    this.moduleContainer = moduleContainer;
    this.chapterContainer = chapterContainer;
    this.lessonContainer = lessonContainer;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Health check endpoint for container monitoring
    this.router.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      });
    });

    this.router.use('/', this.authContainer.getRouter());
    this.router.use('/', this.courseContainer.getRouter());
    this.router.use('/', this.moduleContainer.getRouter());
    this.router.use('/', this.chapterContainer.getRouter());
    // this.router.use('/', this.lessonContainer.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
