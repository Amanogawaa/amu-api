import { relations } from "drizzle-orm/relations";
import { users, courses, courseInstructors, instructors, lessons, lessonResources, quizzes, chapters, quizQuestions, quizOptions } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	user: one(users, {
		fields: [users.id],
		references: [users.id],
		relationName: "users_id_users_id"
	}),
	users: many(users, {
		relationName: "users_id_users_id"
	}),
}));

export const courseInstructorsRelations = relations(courseInstructors, ({one}) => ({
	course: one(courses, {
		fields: [courseInstructors.courseId],
		references: [courses.id]
	}),
	instructor: one(instructors, {
		fields: [courseInstructors.instructorId],
		references: [instructors.id]
	}),
}));

export const coursesRelations = relations(courses, ({many}) => ({
	courseInstructors: many(courseInstructors),
	chapters: many(chapters),
}));

export const instructorsRelations = relations(instructors, ({many}) => ({
	courseInstructors: many(courseInstructors),
}));

export const lessonResourcesRelations = relations(lessonResources, ({one}) => ({
	lesson: one(lessons, {
		fields: [lessonResources.lessonId],
		references: [lessons.id]
	}),
}));

export const lessonsRelations = relations(lessons, ({one, many}) => ({
	lessonResources: many(lessonResources),
	quizzes: many(quizzes),
	chapter: one(chapters, {
		fields: [lessons.chapterId],
		references: [chapters.id]
	}),
}));

export const quizzesRelations = relations(quizzes, ({one, many}) => ({
	lesson: one(lessons, {
		fields: [quizzes.lessonId],
		references: [lessons.id]
	}),
	quizQuestions: many(quizQuestions),
}));

export const chaptersRelations = relations(chapters, ({one, many}) => ({
	course: one(courses, {
		fields: [chapters.courseId],
		references: [courses.id]
	}),
	lessons: many(lessons),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({one, many}) => ({
	quiz: one(quizzes, {
		fields: [quizQuestions.quizId],
		references: [quizzes.id]
	}),
	quizOptions: many(quizOptions),
}));

export const quizOptionsRelations = relations(quizOptions, ({one}) => ({
	quizQuestion: one(quizQuestions, {
		fields: [quizOptions.questionId],
		references: [quizQuestions.id]
	}),
}));