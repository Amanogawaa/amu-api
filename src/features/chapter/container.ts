import { firebaseFirestore } from '../../config/firebase';
import { ChapterController } from './controller';
import { ChapterRepository } from './repository';
import { ChapterRoute } from './route';
import { ChapterService } from './service';

export class ChapterContainer {
  public readonly repository: ChapterRepository;
  public readonly service: ChapterService;
  public readonly controller: ChapterController;
  public readonly routes: ChapterRoute;

  constructor(firestore: FirebaseFirestore.Firestore = firebaseFirestore) {
    this.repository = new ChapterRepository(firestore);
    this.service = new ChapterService(this.repository);
    this.controller = new ChapterController(this.service);
    this.routes = new ChapterRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
