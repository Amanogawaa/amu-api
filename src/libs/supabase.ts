import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";
import "dotenv/config";

const supabaseUrl: string = process.env.SUPABASE_URL || "";
const supabaseAnonKey: string = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
