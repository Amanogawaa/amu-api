import { firebaseFirestore } from "../../config/firebase";
import { LikesController } from "./controller";
import { LikesRepository } from "./repository";
import { LikesRoute } from "./route";
import { LikesService } from "./service";

export class LikesContainer {
  public readonly repository: LikesRepository;
  public readonly service: LikesService;
  public readonly controller: LikesController;
  public readonly routes: LikesRoute;

  constructor(firestore: FirebaseFirestore.Firestore = firebaseFirestore) {
    this.repository = new LikesRepository(firestore);
    this.service = new LikesService(this.repository);
    this.controller = new LikesController(this.service);
    this.routes = new LikesRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
