import { AppAssistantController } from "./controller";
import { AppAssistantRepository } from "./repository";
import { AppAssistantRoute } from "./route";
import { AppAssistantService } from "./service";
import type { Router } from "express";

export class AppAssistantContainer {
  public route: AppAssistantRoute;
  public controller: AppAssistantController;
  public service: AppAssistantService;
  public repository: AppAssistantRepository;

  constructor() {
    this.repository = new AppAssistantRepository();
    this.service = new AppAssistantService(this.repository);
    this.controller = new AppAssistantController(this.service);
    this.route = new AppAssistantRoute(this.controller);
  }

  public getRouter(): Router {
    return this.route.getRouter();
  }
}
