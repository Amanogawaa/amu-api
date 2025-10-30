// packages
import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { Application, NextFunction, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { logger } from './utils/loggers';

// mods
import { AuthContainer } from './features/auth/container';
import { ChapterContainer } from './features/chapter/container';
import { CourseContainer } from './features/course/container';
import { errorHandler } from './middlewares/error.middleware';
import { AppRoutes } from './routes';
import { LessonContainer } from './features/lesson/container';
import { ModuleContainer } from './features/modules/container';

const CORSOPTIONS = {
  origin: ['http://localhost:3000', '*'],
  methods: 'GET,POST,PATCH,PUT,DELETE',
  credentials: true,
};

class App {
  public app: Application;
  public server: http.Server;

  private appRoutes!: AppRoutes;
  private authContainer: AuthContainer;
  private courseContainer: CourseContainer;
  private chapterContainer: ChapterContainer;
  private lessonContainer: LessonContainer;
  private moduleContainer: ModuleContainer;

  constructor(
    authContainer: AuthContainer = new AuthContainer(),
    courseContainer: CourseContainer = new CourseContainer(),
    chapterContainer: ChapterContainer = new ChapterContainer(),
    lessonContainer: LessonContainer = new LessonContainer(),
    moduleContainer: ModuleContainer = new ModuleContainer()
  ) {
    this.app = express();
    this.server = http.createServer(this.app);

    this.authContainer = authContainer;
    this.courseContainer = courseContainer;
    this.chapterContainer = chapterContainer;
    this.lessonContainer = lessonContainer;
    this.moduleContainer = moduleContainer;

    this.app.use(express.json());
    this.app.use(helmet());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors(CORSOPTIONS));
    this.app.use(cookieParser());

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
      this.moduleContainer
    );

    this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    this.app.use('/api', this.appRoutes.getRouter());
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
