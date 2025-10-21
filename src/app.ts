// packages
import type { Request, Response, Application, NextFunction } from 'express';
import http from 'http';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import { logger } from './utils/loggers';
import { swaggerSpec } from './config/swagger';
import helmet from 'helmet';

// mods
import { errorHandler } from './middlewares/error.middleware';
import { AppRoutes } from './routes';
import { AuthContainer } from './features/auth/container';
import { CourseContainer } from './features/course/container';

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

  constructor(
    authContainer: AuthContainer = new AuthContainer(),
    courseContainer: CourseContainer = new CourseContainer()
  ) {
    this.app = express();
    this.server = http.createServer(this.app);

    this.authContainer = authContainer;
    this.courseContainer = courseContainer;

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
    this.appRoutes = new AppRoutes(this.authContainer, this.courseContainer);

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
