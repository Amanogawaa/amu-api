import { firebaseFirestore } from "../../config/firebase";
import { LessonController } from "./controller";
import { LessonRepository } from "./repository";
import { LessonRoute } from "./route";
import { LessonService } from "./service";
import type { QuizService } from "../quiz/service";

export class LessonContainer {
  public readonly repository: LessonRepository;
  public readonly service: LessonService;
  public readonly controller: LessonController;
  public readonly routes: LessonRoute;

  constructor(
    firestore: FirebaseFirestore.Firestore = firebaseFirestore,
    quizService?: QuizService,
  ) {
    this.repository = new LessonRepository(firestore);
    this.service = new LessonService(this.repository, quizService);
    this.controller = new LessonController(this.service);
    this.routes = new LessonRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
