import { Router, type Request, type Response } from 'express';
import { AuthContainer } from './features/auth/container';
import type { ChapterContainer } from './features/chapter/container';
import type { CodePlaygroundContainer } from './features/code-playground/container';
import type { CommentsContainer } from './features/comments/container';
import { CourseContainer } from './features/course/container';
import type { EnrollmentContainer } from './features/enrollment/container';
import type { LessonContainer } from './features/lesson/container';
import type { LikesContainer } from './features/likes/container';
import type { ModuleContainer } from './features/modules/container';
import type { ProgressContainer } from './features/progress/container';
import type { QuizContainer } from './features/quiz/container';
import socketTestRoutes from './features/socket/route';
import type { UserContainer } from './features/user/container';
import type { CapstoneContainer } from './features/capstone/container';

export class AppRoutes {
  private router: Router;
  private authContainer: AuthContainer;
  private courseContainer: CourseContainer;
  private chapterContainer: ChapterContainer;
  private lessonContainer: LessonContainer;
  private moduleContainer: ModuleContainer;
  private progressContainer: ProgressContainer;
  private likesContainer: LikesContainer;
  private commentsContainer: CommentsContainer;
  private userContainer: UserContainer;
  private quizContainer: QuizContainer;
  private enrollmentContainer: EnrollmentContainer;
  private codePlaygroundContainer: CodePlaygroundContainer;
  private capstoneContainer: CapstoneContainer;

  constructor(
    authContainer: AuthContainer,
    courseContainer: CourseContainer,
    chapterContainer: ChapterContainer,
    lessonContainer: LessonContainer,
    moduleContainer: ModuleContainer,
    progressContainer: ProgressContainer,
    likesContainer: LikesContainer,
    commentsContainer: CommentsContainer,
    userContainer: UserContainer,
    quizContainer: QuizContainer,
    enrollmentContainer: EnrollmentContainer,
    codePlaygroundContainer: CodePlaygroundContainer,
    capstoneContainer: CapstoneContainer
  ) {
    this.router = Router();
    this.authContainer = authContainer;
    this.courseContainer = courseContainer;
    this.moduleContainer = moduleContainer;
    this.chapterContainer = chapterContainer;
    this.lessonContainer = lessonContainer;
    this.progressContainer = progressContainer;
    this.likesContainer = likesContainer;
    this.commentsContainer = commentsContainer;
    this.userContainer = userContainer;
    this.quizContainer = quizContainer;
    this.enrollmentContainer = enrollmentContainer;
    this.codePlaygroundContainer = codePlaygroundContainer;
    this.capstoneContainer = capstoneContainer;
    this.initializeRoutes();
  }

  private initializeRoutes() {
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
    this.router.use('/', this.lessonContainer.getRouter());
    this.router.use('/', this.progressContainer.getRouter());
    this.router.use('/', this.likesContainer.getRouter());
    this.router.use('/', this.commentsContainer.getRouter());
    this.router.use('/socket', socketTestRoutes);
    this.router.use('/', this.userContainer.getRouter());
    this.router.use('/', this.quizContainer.getRouter());
    this.router.use('/', this.enrollmentContainer.route.getRouter());
    this.router.use('/', this.codePlaygroundContainer.getRouter());
    this.router.use('/capstone', this.capstoneContainer.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
