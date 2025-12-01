import { CourseController } from "./controller";
import { CourseRepository } from "./repository";
import { CourseRoute } from "./route";
import { CourseService } from "./service";
import { firebaseFirestore } from "../../config/firebase";
import { FullCourseGenerationService } from "../../utils/service/generation.service";
import type { ModuleService } from "../modules/service";
import type { ChapterService } from "../chapter/service";
import type { LessonService } from "../lesson/service";

export class CourseContainer {
  public readonly repository: CourseRepository;
  public readonly service: CourseService;
  public readonly controller: CourseController;
  public readonly routes: CourseRoute;
  public fullGenerationService?: FullCourseGenerationService;

  constructor(
    firestore: FirebaseFirestore.Firestore = firebaseFirestore,
    moduleService?: ModuleService,
    chapterService?: ChapterService,
    lessonService?: LessonService,
  ) {
    this.repository = new CourseRepository(firestore);
    this.service = new CourseService(this.repository);

    if (moduleService && chapterService && lessonService) {
      this.fullGenerationService = new FullCourseGenerationService(
        this.service,
        moduleService,
        chapterService,
        lessonService,
      );
    }

    this.controller = new CourseController(
      this.service,
      this.fullGenerationService,
    );
    this.routes = new CourseRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
