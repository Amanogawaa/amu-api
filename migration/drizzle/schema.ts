import { pgTable, foreignKey, pgPolicy, uuid, text, timestamp, varchar, unique, integer, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: uuid().primaryKey().notNull(),
	email: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [table.id],
			name: "users_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can update their own data", { as: "permissive", for: "update", to: ["public"], using: sql`(auth.uid() = id)` }),
	pgPolicy("Users can view their own data", { as: "permissive", for: "select", to: ["public"] }),
]);

export const courseInstructors = pgTable("course_instructors", {
	courseId: uuid("course_id").notNull(),
	instructorId: uuid("instructor_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "course_instructors_course_id_courses_id_fk"
		}),
	foreignKey({
			columns: [table.instructorId],
			foreignColumns: [instructors.id],
			name: "course_instructors_instructor_id_instructors_id_fk"
		}),
]);

export const instructors = pgTable("instructors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	bio: text().notNull(),
	avatarUrl: text("avatar_url"),
});

export const lessonResources = pgTable("lesson_resources", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	lessonId: uuid("lesson_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	url: text().notNull(),
	type: varchar({ length: 50 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.lessonId],
			foreignColumns: [lessons.id],
			name: "lesson_resources_lesson_id_lessons_id_fk"
		}),
]);

export const quizzes = pgTable("quizzes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	lessonId: uuid("lesson_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.lessonId],
			foreignColumns: [lessons.id],
			name: "quizzes_lesson_id_lessons_id_fk"
		}),
	unique("quizzes_lesson_id_unique").on(table.lessonId),
]);

export const courses = pgTable("courses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	subtitle: varchar({ length: 500 }),
	description: text().notNull(),
	bannerUrl: text("banner_url"),
	category: varchar({ length: 100 }).notNull(),
	topic: varchar({ length: 100 }).notNull(),
	level: varchar({ length: 50 }).notNull(),
	language: varchar({ length: 10 }).default('en'),
	prerequisites: text(),
	learningOutcomes: text("learning_outcomes"),
	duration: varchar({ length: 50 }),
	noOfChapters: integer("no_of_chapters").default(0),
	publish: boolean().default(false),
	includeCertificate: boolean("include_certificate").default(false),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
});

export const chapters = pgTable("chapters", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	courseId: uuid("course_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	estimatedDuration: varchar("estimated_duration", { length: 50 }),
	order: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "chapters_course_id_courses_id_fk"
		}),
]);

export const lessons = pgTable("lessons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chapterId: uuid("chapter_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	description: text(),
	duration: varchar({ length: 50 }),
	videoUrl: text("video_url"),
	content: text(),
	order: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "lessons_chapter_id_chapters_id_fk"
		}),
]);

export const quizQuestions = pgTable("quiz_questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quizId: uuid("quiz_id").notNull(),
	question: text().notNull(),
	type: varchar({ length: 50 }).notNull(),
	correctAnswer: text("correct_answer"),
	explanation: text(),
}, (table) => [
	foreignKey({
			columns: [table.quizId],
			foreignColumns: [quizzes.id],
			name: "quiz_questions_quiz_id_quizzes_id_fk"
		}),
]);

export const quizOptions = pgTable("quiz_options", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	questionId: uuid("question_id").notNull(),
	optionText: text("option_text").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [quizQuestions.id],
			name: "quiz_options_question_id_quiz_questions_id_fk"
		}),
]);
