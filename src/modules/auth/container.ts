import { CSupabaseClient } from '../../config/supabase';
import { AuthController } from './controller';
import { AuthRepository } from './repository';
import { AuthRoute } from './route';
import { AuthService } from './service';
import type { SupabaseClient } from '@supabase/supabase-js';

export class AuthContainer {
  public readonly repository: AuthRepository;
  public readonly service: AuthService;
  public readonly controller: AuthController;
  public readonly routes: AuthRoute;

  constructor(
    supabaseClient: SupabaseClient = new CSupabaseClient().getClient
  ) {
    try {
      // Initialize in order of dependency
      this.repository = new AuthRepository(supabaseClient);
      this.service = new AuthService(this.repository);
      this.controller = new AuthController(this.service);
      this.routes = new AuthRoute(this.controller);
    } catch (error) {
      throw new Error(
        `Failed to initialize AuthContainer: ${(error as Error).message}`
      );
    }
  }

  getRouter() {
    return this.routes.router;
  }
}
