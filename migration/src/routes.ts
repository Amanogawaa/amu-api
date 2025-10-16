import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import type { CourseContainer } from './modules/course/container';
import { ChapterContainer } from './modules/chapter/container';
import { LessonContainer } from './modules/lesson/container';
import { AuthContainer } from './modules/auth/container';
import { UserCourseContainer } from './modules/user-course/container';

export class AppRoutes {
  private router: Router;
  private courseContainer: CourseContainer;
  private chapterContainer: ChapterContainer;
  private lessonContainer: LessonContainer;
  private authContainer: AuthContainer;
  private userCourseContainer: UserCourseContainer;

  constructor(
    courseContainer: CourseContainer,
    chapterContainer: ChapterContainer,
    lessonContainer: LessonContainer,
    authContainer: AuthContainer,
    userCourseContainer: UserCourseContainer
  ) {
    this.router = Router();
    this.courseContainer = courseContainer;
    this.chapterContainer = chapterContainer;
    this.lessonContainer = lessonContainer;
    this.authContainer = authContainer;
    this.userCourseContainer = userCourseContainer;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use('/amu', this.courseContainer.getRouter());
    this.router.use('/amu', this.chapterContainer.getRouter());
    this.router.use('/amu', this.lessonContainer.getRouter());
    this.router.use('/amu', this.authContainer.getRouter());
    this.router.use('/amu', this.userCourseContainer.getRouter());

    this.router.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: err.message });
      }
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
