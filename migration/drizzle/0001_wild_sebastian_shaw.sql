CREATE TABLE "user_courses" (
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"progress" integer DEFAULT 0,
	"completed_at" timestamp with time zone,
	CONSTRAINT "user_courses_pkey" UNIQUE("user_id","course_id")
);
--> statement-breakpoint
ALTER TABLE "user_courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Users can view their own enrollments" ON "user_courses" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can insert their own enrollments" ON "user_courses" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));