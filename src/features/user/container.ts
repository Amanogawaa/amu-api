import { firebaseFirestore } from '../../config/firebase';
import { UserController } from './controller';
import { UserRepository } from './repository';
import { UserRoute } from './route';
import { UserService } from './service';

export class UserContainer {
  public readonly repository: UserRepository;
  public readonly service: UserService;
  public readonly controller: UserController;
  public readonly routes: UserRoute;

  constructor(firestore: FirebaseFirestore.Firestore = firebaseFirestore) {
    this.repository = new UserRepository(firestore);
    this.service = new UserService(this.repository);
    this.controller = new UserController(this.service);
    this.routes = new UserRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
