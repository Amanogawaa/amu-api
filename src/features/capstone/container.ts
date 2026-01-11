import { CapstoneController } from "./controller";
import { CapstoneRepository } from "./repository";
import { CapstoneRoute } from "./route";
import { CapstoneService } from "./service";
import { GitHubService } from "../github/service";
import { firebaseFirestore } from "../../config/firebase";
import type { Firestore } from "firebase-admin/firestore";
import type { CourseRepository } from "../course/repository";
import type { ChapterRepository } from "../chapter/repository";
import type { LessonRepository } from "../lesson/repository";

export class CapstoneContainer {
  public readonly repository: CapstoneRepository;
  public readonly githubService: GitHubService;
  public readonly service: CapstoneService;
  public readonly controller: CapstoneController;
  public readonly routes: CapstoneRoute;

  constructor(
    firestore: Firestore = firebaseFirestore,
    courseRepository?: CourseRepository,
    chapterRepository?: ChapterRepository,
    lessonRepository?: LessonRepository,
  ) {
    this.repository = new CapstoneRepository(firestore);
    this.githubService = new GitHubService();

    if (courseRepository && chapterRepository && lessonRepository) {
      this.service = new CapstoneService(
        this.repository,
        this.githubService,
        courseRepository,
        chapterRepository,
        lessonRepository,
      );
    } else {
      throw new Error(
        "CapstoneContainer requires all repository dependencies for generation features",
      );
    }

    this.controller = new CapstoneController(this.service);
    this.routes = new CapstoneRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
