import type { SupabaseClient } from "@supabase/supabase-js";

export class CourseRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getCourse() {
    const { data, error } = await this.supabase.from("course").select("*");

    if (error) throw new Error();

    return data;
  }
}
