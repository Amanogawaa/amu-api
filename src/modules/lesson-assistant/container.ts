import { LessonAssistantRepository } from "./repository";
import { LessonAssistantService } from "./service";
import { LessonAssistantController } from "./controller";
import { LessonAssistantRoute } from "./route";
import { ContextBuilder } from "./context-builder";
import { LessonRepository } from "../lesson/repository";

export class LessonAssistantContainer {
  public readonly repository: LessonAssistantRepository;
  public readonly contextBuilder: ContextBuilder;
  public readonly service: LessonAssistantService;
  public readonly controller: LessonAssistantController;
  public readonly routes: LessonAssistantRoute;

  constructor(lessonRepository?: LessonRepository) {
    const lessonRepo = lessonRepository || new LessonRepository();

    this.repository = new LessonAssistantRepository();
    this.contextBuilder = new ContextBuilder(lessonRepo);
    this.service = new LessonAssistantService(
      this.repository,
      this.contextBuilder,
    );
    this.controller = new LessonAssistantController(this.service);
    this.routes = new LessonAssistantRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
