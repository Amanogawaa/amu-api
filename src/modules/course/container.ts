import { CourseService } from "./service";
import { CourseController } from "./controller";
import { CourseRoutes } from "./route";

/**
 * Container for managing course module dependencies
 */
export class CourseContainer {
  private courseService: CourseService;
  private courseController: CourseController;
  private routes: CourseRoutes;

  constructor() {
    this.courseService = new CourseService();
    this.courseController = new CourseController(this.courseService);
    this.routes = new CourseRoutes(this.courseController);
  }

  getRouter() {
    return this.routes.router;
  }
}
