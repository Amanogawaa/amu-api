import { Router } from "express";
import type { CourseContainer } from "./modules/course/container";

export class AppRoutes {
  private router: Router;
  private courseContainer: CourseContainer;

  constructor(courseContainer: CourseContainer) {
    this.router = Router();
    this.courseContainer = courseContainer;

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use("/", this.courseContainer.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
