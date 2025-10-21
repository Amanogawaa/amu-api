import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { AuthContainer } from './features/auth/container';
import { CourseContainer } from './features/course/container';

export class AppRoutes {
  private router: Router;
  private authContainer: AuthContainer;
  private courseContainer: CourseContainer;

  constructor(authContainer: AuthContainer, courseContainer: CourseContainer) {
    this.router = Router();
    this.courseContainer = courseContainer;
    this.authContainer = authContainer;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use('/', this.authContainer.getRouter());
    this.router.use('/', this.courseContainer.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
