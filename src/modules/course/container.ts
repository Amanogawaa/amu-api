import { CSupabaseClient } from "../../config/supabase";
import { CourseController } from "./controller";
import { CourseRepository } from "./repository";
import { CourseRoute } from "./route";
import { CourseService } from "./service";

export class CourseContainer {
  public readonly repository: CourseRepository;
  public readonly service: CourseService;
  public readonly controller: CourseController;
  public readonly routes: CourseRoute;

  constructor() {
    const supabase = new CSupabaseClient().getClient;
    this.repository = new CourseRepository(supabase);
    this.service = new CourseService(this.repository);
    this.controller = new CourseController(this.service);
    this.routes = new CourseRoute(this.controller);
  }

  getRouter() {
    return this.routes.router;
  }
}
