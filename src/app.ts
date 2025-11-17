import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { Application, NextFunction, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { logger } from './utils/loggers';
import type { Server as SocketIOServer } from 'socket.io';
import { initializeSocketIO } from './config/socket';
import { socketAuthMiddleware } from './middlewares/socket.middleware';
import { SocketHandlers } from './utils/socket/socket.handlers';
import path from 'path';

import { AuthContainer } from './features/auth/container';
import { ChapterContainer } from './features/chapter/container';
import { CourseContainer } from './features/course/container';
import { errorHandler } from './middlewares/error.middleware';
import { AppRoutes } from './routes';
import { LessonContainer } from './features/lesson/container';
import { ModuleContainer } from './features/modules/container';
import { ProgressContainer } from './features/progress/container';
import { LikesContainer } from './features/likes/container';
import { CommentsContainer } from './features/comments/container';
import { UserContainer } from './features/user/container';
import { QuizContainer } from './features/quiz/container';
import { EnrollmentContainer } from './features/enrollment/container';
import { CodePlaygroundContainer } from './features/code-playground/container';
import { CapstoneContainer } from './features/capstone/container';

const CORSOPTIONS = {
  origin: ['http://localhost:3000', '*'],
  methods: 'GET,POST,PATCH,PUT,DELETE',
  credentials: true,
};

class App {
  public app: Application;
  public server: http.Server;
  public io: SocketIOServer;
  public socketHandlers: SocketHandlers;

  private appRoutes!: AppRoutes;
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
    authContainer: AuthContainer = new AuthContainer(),
    moduleContainer: ModuleContainer = new ModuleContainer(),
    chapterContainer: ChapterContainer = new ChapterContainer(),
    lessonContainer?: LessonContainer,
    courseContainer?: CourseContainer,
    progressContainer: ProgressContainer = new ProgressContainer(),
    likesContainer: LikesContainer = new LikesContainer(),
    commentsContainer: CommentsContainer = new CommentsContainer(),
    userContainer: UserContainer = new UserContainer(),
    quizContainer: QuizContainer = new QuizContainer(),
    codePlaygroundContainer: CodePlaygroundContainer = new CodePlaygroundContainer()
  ) {
    this.app = express();
    this.server = http.createServer(this.app);

    this.io = initializeSocketIO(this.server);
    this.io.use(socketAuthMiddleware);
    this.socketHandlers = new SocketHandlers(this.io);
    this.socketHandlers.registerHandlers();

    this.authContainer = authContainer;
    this.moduleContainer = moduleContainer;
    this.chapterContainer = chapterContainer;
    this.quizContainer = quizContainer;

    this.lessonContainer =
      lessonContainer || new LessonContainer(undefined, quizContainer.service);

    this.codePlaygroundContainer = codePlaygroundContainer;
    this.capstoneContainer = new CapstoneContainer();

    this.courseContainer =
      courseContainer ||
      new CourseContainer(
        undefined,
        moduleContainer.service,
        chapterContainer.service,
        this.lessonContainer.service,
        this.capstoneContainer.service
      );

    this.progressContainer = progressContainer;
    this.likesContainer = likesContainer;
    this.commentsContainer = commentsContainer;
    this.userContainer = userContainer;

    this.enrollmentContainer = new EnrollmentContainer(
      this.courseContainer.repository,
      this.progressContainer.repository
    );

    this.app.use(express.json());
    this.app.use(helmet());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors(CORSOPTIONS));
    this.app.use(cookieParser());

    this.app.use(
      '/uploads',
      express.static(path.join(process.cwd(), 'uploads'))
    );

    this.app.use(
      cors({
        origin: process.env.NEXTJS_FRONTEND_URL || 'http://localhost:3000',
      })
    );

    this.initializeMiddleware();
    this.initializeRouter();

    this.app.use(errorHandler);
  }

  private initializeRouter(): void {
    this.appRoutes = new AppRoutes(
      this.authContainer,
      this.courseContainer,
      this.chapterContainer,
      this.lessonContainer,
      this.moduleContainer,
      this.progressContainer,
      this.likesContainer,
      this.commentsContainer,
      this.userContainer,
      this.quizContainer,
      this.enrollmentContainer,
      this.codePlaygroundContainer,
      this.capstoneContainer
    );

    this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    this.app.use('/api', this.appRoutes.getRouter());

    this.app.locals.io = this.io;
    this.app.locals.socketHandlers = this.socketHandlers;
  }

  private initializeMiddleware(): void {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  public async start(port: number = 8080): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(port, () => {
        logger.info(`Server running on http://localhost:${port}`);
        resolve();
      });
      this.server.on('error', (error) => {
        logger.error('Server failed to start:', error);
        reject(error);
      });
    });
  }
}

export default new App();
