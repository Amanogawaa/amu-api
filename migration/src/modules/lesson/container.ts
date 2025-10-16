import { SupabaseClient } from '@supabase/supabase-js';
import { LessonController } from './controller';
import { LessonRepository } from './repository';
import { LessonRoute } from './route';
import { LessonService } from './service';
import { CSupabaseClient } from '../../config/supabase';

export class LessonContainer {
  public readonly repository: LessonRepository;
  public readonly service: LessonService;
  public readonly controller: LessonController;
  public readonly routes: LessonRoute;

  constructor(
    supabaseClient: SupabaseClient = new CSupabaseClient().getClient
  ) {
    try {
      this.repository = new LessonRepository(supabaseClient);
      this.service = new LessonService(this.repository);
      this.controller = new LessonController(this.service);
      this.routes = new LessonRoute(this.controller);
    } catch (error) {
      throw new Error(
        `Failed to initialize LessonContainer: ${(error as Error).message}`
      );
    }
  }

  getRouter() {
    return this.routes.router;
  }
}
