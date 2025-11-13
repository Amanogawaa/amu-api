import { firebaseFirestore } from '../../config/firebase';
import { QuizController } from './controller';
import { QuizRepository } from './repository';
import { QuizRoute } from './route';
import { QuizService } from './service';

export class QuizContainer {
  public readonly repository: QuizRepository;
  public readonly service: QuizService;
  public readonly controller: QuizController;
  public readonly routes: QuizRoute;

  constructor(firestore: FirebaseFirestore.Firestore = firebaseFirestore) {
    this.repository = new QuizRepository(firestore);
    this.service = new QuizService(this.repository);
    this.controller = new QuizController(this.service);
    this.routes = new QuizRoute(this.controller);
  }

  getRouter() {
    return this.routes.router;
  }
}
