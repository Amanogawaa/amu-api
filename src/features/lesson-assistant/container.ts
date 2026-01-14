import { LessonAssistantRepository } from "./repository";
import { LessonAssistantService } from "./service";
import { LessonAssistantController } from "./controller";
import { ContextBuilder } from "./context-builder";
import { LessonRepository } from "../lesson/repository";

// Initialize repositories
const lessonRepository = new LessonRepository();
const assistantRepository = new LessonAssistantRepository();

// Initialize context builder
const contextBuilder = new ContextBuilder(lessonRepository);

// Initialize service
const assistantService = new LessonAssistantService(
  assistantRepository,
  contextBuilder,
);

// Initialize controller
const assistantController = new LessonAssistantController(assistantService);

export const lessonAssistantContainer = {
  repository: assistantRepository,
  contextBuilder,
  service: assistantService,
  controller: assistantController,
};

export class LessonAssistantContainer {
  public readonly repository: LessonAssistantRepository;
  public readonly contextBuilder: ContextBuilder;
  public readonly service: LessonAssistantService;
  public readonly controller: LessonAssistantController;

  constructor() {}
}
