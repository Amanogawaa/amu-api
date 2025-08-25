import { SupabaseClient } from '@supabase/supabase-js';
import { ChapterController } from './controller';
import { ChapterRepository } from './repository';
import { ChapterRoute } from './route';
import { ChapterService } from './service';
import { CSupabaseClient } from '../../config/supabase';

export class ChapterContainer {
  public readonly repository: ChapterRepository;
  public readonly service: ChapterService;
  public readonly controller: ChapterController;
  public readonly routes: ChapterRoute;

  constructor(
    supabaseClient: SupabaseClient = new CSupabaseClient().getClient
  ) {
    try {
      this.repository = new ChapterRepository(supabaseClient);
      this.service = new ChapterService(this.repository);
      this.controller = new ChapterController(this.service);
      this.routes = new ChapterRoute(this.controller);
    } catch (error) {
      throw new Error(
        `Failed to initialize ChapterContainer: ${(error as Error).message}`
      );
    }
  }

  getRouter() {
    return this.routes.router;
  }
}
