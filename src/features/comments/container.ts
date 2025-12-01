import { firebaseFirestore } from "../../config/firebase";
import { CommentsController } from "./controller";
import { CommentsRepository } from "./repository";
import { CommentsRoute } from "./route";
import { CommentsService } from "./service";

export class CommentsContainer {
  public readonly repository: CommentsRepository;
  public readonly service: CommentsService;
  public readonly controller: CommentsController;
  public readonly routes: CommentsRoute;

  constructor(firestore: FirebaseFirestore.Firestore = firebaseFirestore) {
    this.repository = new CommentsRepository(firestore);
    this.service = new CommentsService(this.repository);
    this.controller = new CommentsController(this.service);
    this.routes = new CommentsRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
