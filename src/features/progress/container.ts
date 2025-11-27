import { firebaseFirestore } from '../../config/firebase';
import { ProgressController } from './controller';
import { ProgressRepository } from './repository';
import { ProgressRoute } from './route';
import { ProgressService } from './service';
import type { QuizService } from '../quiz/service';
import type { LessonService } from '../lesson/service';

export class ProgressContainer {
  public readonly repository: ProgressRepository;
  public readonly service: ProgressService;
  public readonly controller: ProgressController;
  public readonly routes: ProgressRoute;

  constructor(
    firestore: FirebaseFirestore.Firestore = firebaseFirestore,
    quizService?: QuizService,
    lessonService?: LessonService
  ) {
    this.repository = new ProgressRepository(firestore);
    this.service = new ProgressService(
      this.repository,
      quizService,
      lessonService
    );
    this.controller = new ProgressController(this.service);
    this.routes = new ProgressRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
