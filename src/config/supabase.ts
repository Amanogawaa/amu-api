import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { config } from "./environment";

export class CSupabaseClient {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(config.supabase.url, config.supabase.key);
  }

  get getClient() {
    return this.client;
  }
}

export const client = new CSupabaseClient();
