import { SupabaseClient } from '@supabase/supabase-js';
import { UserCourseController } from './controller';
import { UserCourseRepository } from './repository';
import { UserCourseRoute } from './route';
import { UserCourseService } from './service';
import { CSupabaseClient } from '../../config/supabase';

export class UserCourseContainer {
  public readonly repository: UserCourseRepository;
  public readonly service: UserCourseService;
  public readonly controller: UserCourseController;
  public readonly routes: UserCourseRoute;

  constructor(
    supabaseClient: SupabaseClient = new CSupabaseClient().getClient
  ) {
    try {
      this.repository = new UserCourseRepository(supabaseClient);
      this.service = new UserCourseService(this.repository);
      this.controller = new UserCourseController(this.service);
      this.routes = new UserCourseRoute(this.controller);
    } catch (error) {
      throw new Error(
        `Failed to initialize UserCourseContainer: ${(error as Error).message}`
      );
    }
  }

  getRouter() {
    return this.routes.router;
  }
}
