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

class App {
  public app: Application;
  public server: http.Server;

  private appRoutes: AppRoutes;
  private courseContainer: CourseContainer;

  constructor(courseContainer: CourseContainer = new CourseContainer()) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.courseContainer = courseContainer;

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(
      cors({
        origin: process.env.NEXTJS_FRONTEND_URL || 'http://localhost:3000',
      })
    );

    this.initializeMiddleware();
    this.initializeRouter();
  }

  private initializeRouter(): void {
    this.appRoutes = new AppRoutes(this.courseContainer);
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
