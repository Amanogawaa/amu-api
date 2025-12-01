import { firebaseFirestore } from "../../config/firebase";
import { ModuleController } from "./controller";
import { ModuleRepository } from "./repository";
import { ModuleRoute } from "./route";
import { ModuleService } from "./service";

export class ModuleContainer {
  public readonly repository: ModuleRepository;
  public readonly service: ModuleService;
  public readonly controller: ModuleController;
  public readonly routes: ModuleRoute;

  constructor(firestore: FirebaseFirestore.Firestore = firebaseFirestore) {
    this.repository = new ModuleRepository(firestore);
    this.service = new ModuleService(this.repository);
    this.controller = new ModuleController(this.service);
    this.routes = new ModuleRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
