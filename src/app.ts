import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import http from 'http';
import cors from 'cors';
import { logger } from './core/utils/loggers';
import { AppRoutes } from './routes';
import { CourseContainer } from './modules/course/container';
import { ChapterContainer } from './modules/chapter/container';
import { LessonContainer } from './modules/lesson/container';
import { swaggerSpec } from './config/swagger';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import { AuthContainer } from './modules/auth/container';
import { UserCourseContainer } from './modules/user-course/container';

const corsOption = {
  origin: ['http://localhost:3000', '*'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

class App {
  public app: Application;
  public server: http.Server;

  private appRoutes: AppRoutes;
  private courseContainer: CourseContainer;
  private chapterContainer: ChapterContainer;
  private lessonContainer: LessonContainer;
  private authContainer: AuthContainer;
  private userCourseContainer: UserCourseContainer;

  constructor(
    courseContainer: CourseContainer = new CourseContainer(),
    chapterContainer: ChapterContainer = new ChapterContainer(),
    lessonContainer: LessonContainer = new LessonContainer(),
    authContainer: AuthContainer = new AuthContainer(),
    userCourseContainer: UserCourseContainer = new UserCourseContainer(),
  ) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.courseContainer = courseContainer;
    this.chapterContainer = chapterContainer;
    this.lessonContainer = lessonContainer;
    this.authContainer = authContainer;
    this.userCourseContainer = userCourseContainer;

    // middlewares
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors(corsOption));
    this.app.use(cookieParser());
    this.app.use(
      cors({
        origin: process.env.NEXTJS_FRONTEND_URL || 'http://localhost:3000',
      }),
    );

    this.initializeMiddleware();
    this.initializeRouter();
  }

  private initializeRouter(): void {
    this.appRoutes = new AppRoutes(
      this.courseContainer,
      this.chapterContainer,
      this.lessonContainer,
      this.authContainer,
      this.userCourseContainer,
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
