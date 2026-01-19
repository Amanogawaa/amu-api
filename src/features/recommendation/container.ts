import { firebaseFirestore } from "@config/firebase";
import { CourseRepository } from "../course/repository";
import { ProgressRepository } from "../progress/repository";
import { RecommendationController } from "./controller";
import { RecommendationRepository } from "./repository";
import { RecommendationRoute } from "./route";
import { RecommendationService } from "./service";

export class RecommendationContainer {
  public readonly repository: RecommendationRepository;
  public readonly courseRepository: CourseRepository;
  public readonly progressRepository: ProgressRepository;
  public readonly service: RecommendationService;
  public readonly controller: RecommendationController;
  public readonly routes: RecommendationRoute;

  constructor(firestore: FirebaseFirestore.Firestore = firebaseFirestore) {
    this.repository = new RecommendationRepository();
    this.courseRepository = new CourseRepository();
    this.progressRepository = new ProgressRepository(firestore);
    this.service = new RecommendationService(
      this.repository,
      this.courseRepository,
      this.progressRepository,
    );
    this.controller = new RecommendationController(this.service);
    this.routes = new RecommendationRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
