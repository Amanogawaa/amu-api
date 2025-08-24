import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import type { CourseContainer } from './modules/course/container';

export class AppRoutes {
  private router: Router;
  private courseContainer: CourseContainer;

  constructor(courseContainer: CourseContainer) {
    this.router = Router();
    this.courseContainer = courseContainer;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use('/courses', this.courseContainer.getRouter());
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
