import { CSupabaseClient } from '../../config/supabase';
import { CourseController } from './controller';
import { CourseRepository } from './repository';
import { CourseRoute } from './route';
import { CourseService } from './service';
import type { SupabaseClient } from '@supabase/supabase-js';

export class CourseContainer {
  public readonly repository: CourseRepository;
  public readonly service: CourseService;
  public readonly controller: CourseController;
  public readonly routes: CourseRoute;

  constructor(
    supabaseClient: SupabaseClient = new CSupabaseClient().getClient
  ) {
    try {
      this.repository = new CourseRepository(supabaseClient);
      this.service = new CourseService(this.repository);
      this.controller = new CourseController(this.service);
      this.routes = new CourseRoute(this.controller);
    } catch (error) {
      throw new Error(
        `Failed to initialize CourseContainer: ${(error as Error).message}`
      );
    }
  }

  getRouter() {
    return this.routes.router;
  }
}
