import { CourseController } from './controller';
import { CourseRepository } from './repository';
import { CourseRoute } from './route';
import { CourseService } from './service';
import { firebaseFirestore } from '../../config/firebase';

export class CourseContainer {
  public readonly repository: CourseRepository;
  public readonly service: CourseService;
  public readonly controller: CourseController;
  public readonly routes: CourseRoute;

  constructor(firestore: FirebaseFirestore.Firestore = firebaseFirestore) {
    this.repository = new CourseRepository(firestore);
    this.service = new CourseService(this.repository);
    this.controller = new CourseController(this.service);
    this.routes = new CourseRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
