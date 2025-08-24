import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { config } from './environment';
import { logger } from '../core/utils/loggers';

export class CSupabaseClient {
  private client: SupabaseClient;

  constructor(
    url: string = config.supabase.url,
    key: string = config.supabase.key
  ) {
    try {
      this.client = createClient(url, key);
    } catch (error) {
      logger.error('Failed to initialize Supabase client:', error);
      throw new Error(
        `Supabase client initialization failed: ${(error as Error).message}`
      );
    }
  }

  get getClient(): SupabaseClient {
    return this.client;
  }
}
