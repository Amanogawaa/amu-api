import { ChapterService } from "./service";
import { ChapterController } from "./controller";
import { ChapterRoutes } from "./routes";

/**
 * Container for managing chapter module dependencies
 */
export class ChapterContainer {
  private chapterService: ChapterService;
  private chapterController: ChapterController;
  private routes: ChapterRoutes;

  constructor() {
    this.chapterService = new ChapterService();
    this.chapterController = new ChapterController(this.chapterService);
    this.routes = new ChapterRoutes(this.chapterController);
  }

  getRouter() {
    return this.routes.router;
  }
}
