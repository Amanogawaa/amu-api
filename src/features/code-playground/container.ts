import { CodePlaygroundRepository } from "./repository";
import { CodePlaygroundService } from "./service";
import { CodePlaygroundController } from "./controller";
import { CodePlaygroundRoute } from "./route";

export class CodePlaygroundContainer {
  public readonly repository: CodePlaygroundRepository;
  public readonly service: CodePlaygroundService;
  public readonly controller: CodePlaygroundController;
  public readonly routes: CodePlaygroundRoute;

  constructor() {
    this.repository = new CodePlaygroundRepository();
    this.service = new CodePlaygroundService(this.repository);
    this.controller = new CodePlaygroundController(this.service);
    this.routes = new CodePlaygroundRoute(this.controller);
  }

  getRouter() {
    return this.routes.router;
  }
}
