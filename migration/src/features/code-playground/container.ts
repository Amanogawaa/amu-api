import { CodePlaygroundRepository } from "./repository";
import { CodePlaygroundService } from "./service";
import { CodePlaygroundController } from "./controller";
import { CodePlaygroundRoute } from "./route";
import type { CourseRepository } from "../course/repository";
import type { ChapterRepository } from "../chapter/repository";
import type { LessonRepository } from "../lesson/repository";

export class CodePlaygroundContainer {
  public readonly repository: CodePlaygroundRepository;
  public readonly service: CodePlaygroundService;
  public readonly controller: CodePlaygroundController;
  public readonly routes: CodePlaygroundRoute;

  constructor(
    courseRepository?: CourseRepository,
    chapterRepository?: ChapterRepository,
    lessonRepository?: LessonRepository,
  ) {
    this.repository = new CodePlaygroundRepository();
    this.service = new CodePlaygroundService(
      this.repository,
      courseRepository,
      chapterRepository,
      lessonRepository,
    );
    this.controller = new CodePlaygroundController(this.service);
    this.routes = new CodePlaygroundRoute(this.controller);
  }

  getRouter() {
    return this.routes.router;
  }
}
