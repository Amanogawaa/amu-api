import { Router } from "express";
import { LessonService } from "./service";
import { LessonController } from "./controller";
import { LessonRoutes } from "./route";

/**
 * Container for managing lesson module dependencies
 */
export class LessonContainer {
  private lessonService: LessonService;
  private lessonController: LessonController;
  private routes: LessonRoutes;

  constructor() {
    this.lessonService = new LessonService();
    this.lessonController = new LessonController(this.lessonService);
    this.routes = new LessonRoutes(this.lessonController);
  }

  getRouter() {
    return this.routes.router;
  }
}
