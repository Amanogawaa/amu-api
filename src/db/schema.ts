import {
  pgTable,
  foreignKey,
  pgPolicy,
  uuid,
  text,
  timestamp,
  varchar,
  unique,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm/relations';

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().notNull(),
    email: text(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [table.id],
      name: 'users_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can update their own data', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
      using: sql`(auth.uid() = id)`,
    }),
    pgPolicy('Users can view their own data', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
  ]
);

export const lessonResources = pgTable(
  'lesson_resources',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    lessonId: uuid('lesson_id').notNull(),
    title: varchar({ length: 255 }).notNull(),
    url: text().notNull(),
    type: varchar({ length: 50 }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lessons.id],
      name: 'lesson_resources_lesson_id_lessons_id_fk',
    }),
  ]
);

export const quizzes = pgTable(
  'quizzes',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    lessonId: uuid('lesson_id').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lessons.id],
      name: 'quizzes_lesson_id_lessons_id_fk',
    }),
    unique('quizzes_lesson_id_unique').on(table.lessonId),
  ]
);

export const courses = pgTable('courses', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: varchar({ length: 255 }).notNull(),
  subtitle: varchar({ length: 500 }),
  description: text().notNull(),
  bannerUrl: text('banner_url'),
  category: varchar({ length: 100 }).notNull(),
  topic: varchar({ length: 100 }).notNull(),
  level: varchar({ length: 50 }).notNull(),
  language: varchar({ length: 10 }).default('en'),
  prerequisites: text(),
  learningOutcomes: text('learning_outcomes'),
  duration: varchar({ length: 50 }),
  noOfChapters: integer('no_of_chapters').default(0),
  publish: boolean().default(false),
  lastUpdated: timestamp('last_updated', { mode: 'string' }).defaultNow(),
});

export const chapters = pgTable(
  'chapters',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    courseId: uuid('course_id').notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    estimatedDuration: varchar('estimated_duration', { length: 50 }),
    order: integer().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [courses.id],
      name: 'chapters_course_id_courses_id_fk',
    }),
  ]
);

export const lessons = pgTable(
  'lessons',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    chapterId: uuid('chapter_id').notNull(),
    title: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 50 }).notNull(),
    description: text(),
    duration: varchar({ length: 50 }),
    videoUrl: text('video_url'),
    content: text(),
    order: integer().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.chapterId],
      foreignColumns: [chapters.id],
      name: 'lessons_chapter_id_chapters_id_fk',
    }),
  ]
);

export const quizQuestions = pgTable(
  'quiz_questions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    quizId: uuid('quiz_id').notNull(),
    question: text().notNull(),
    type: varchar({ length: 50 }).notNull(),
    correctAnswer: text('correct_answer'),
    explanation: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.quizId],
      foreignColumns: [quizzes.id],
      name: 'quiz_questions_quiz_id_quizzes_id_fk',
    }),
  ]
);

export const quizOptions = pgTable(
  'quiz_options',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    questionId: uuid('question_id').notNull(),
    optionText: text('option_text').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.questionId],
      foreignColumns: [quizQuestions.id],
      name: 'quiz_options_question_id_quiz_questions_id_fk',
    }),
  ]
);

export const userCourses = pgTable(
  'user_courses',
  {
    userId: uuid('user_id').notNull(),
    courseId: uuid('course_id').notNull(),
    enrolledAt: timestamp('enrolled_at', {
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    progress: integer('progress').default(0),
    completedAt: timestamp('completed_at', {
      withTimezone: true,
      mode: 'string',
    }),
  },
  (table) => [
    // Composite primary key for userId and courseId
    unique('user_courses_pkey').on(table.userId, table.courseId),
    // Foreign key to users
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'user_courses_user_id_users_id_fk',
    }).onDelete('cascade'),
    // Foreign key to courses
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [courses.id],
      name: 'user_courses_course_id_courses_id_fk',
    }).onDelete('cascade'),
    // RLS policy: Users can view their own enrollments
    pgPolicy('Users can view their own enrollments', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(auth.uid() = user_id)`,
    }),
    // RLS policy: Users can enroll themselves
    pgPolicy('Users can insert their own enrollments', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
  ]
);

export const userLessonProgress = pgTable(
  'user_lesson_progress',
  {
    userId: uuid('user_id').notNull(),
    lessonId: uuid('lesson_id').notNull(),
    completedAt: timestamp('completed_at', {
      withTimezone: true,
      mode: 'string',
    }),
    score: integer(),
  },
  (table) => [
    unique('user_lesson_progress_pkey').on(table.userId, table.lessonId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'user_lesson_progress_user_id_users_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lessons.id],
      name: 'user_lesson_progress_lesson_id_lessons_id_fk',
    }).onDelete('cascade'),
    pgPolicy('Users can view their own progress', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can insert their own progress', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can update their own progress', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
      using: sql`(auth.uid() = user_id)`,
    }),
  ]
);

export const userLessonProgressRelations = relations(
  userLessonProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [userLessonProgress.userId],
      references: [users.id],
    }),
    lesson: one(lessons, {
      fields: [userLessonProgress.lessonId],
      references: [lessons.id],
    }),
  })
);

// relations

export const userCoursesRelations = relations(userCourses, ({ one }) => ({
  user: one(users, {
    fields: [userCourses.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userCourses.courseId],
    references: [courses.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  user: one(users, {
    fields: [users.id],
    references: [users.id],
    relationName: 'users_id_users_id',
  }),
  users: many(users, {
    relationName: 'users_id_users_id',
  }),
  userCourses: many(userCourses),
  userLessonProgress: many(userLessonProgress),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  chapters: many(chapters),
  userCourses: many(userCourses),
}));

// export const usersRelations = relations(users, ({ one, many }) => ({
//   user: one(users, {
//     fields: [users.id],
//     references: [users.id],
//     relationName: 'users_id_users_id',
//   }),
//   users: many(users, {
//     relationName: 'users_id_users_id',
//   }),
// }));

export const lessonResourcesRelations = relations(
  lessonResources,
  ({ one }) => ({
    lesson: one(lessons, {
      fields: [lessonResources.lessonId],
      references: [lessons.id],
    }),
  })
);

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  lessonResources: many(lessonResources),
  quizzes: many(quizzes),
  chapter: one(chapters, {
    fields: [lessons.chapterId],
    references: [chapters.id],
  }),
  userLessonProgress: many(userLessonProgress),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id],
  }),
  quizQuestions: many(quizQuestions),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  course: one(courses, {
    fields: [chapters.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const quizQuestionsRelations = relations(
  quizQuestions,
  ({ one, many }) => ({
    quiz: one(quizzes, {
      fields: [quizQuestions.quizId],
      references: [quizzes.id],
    }),
    quizOptions: many(quizOptions),
  })
);

export const quizOptionsRelations = relations(quizOptions, ({ one }) => ({
  quizQuestion: one(quizQuestions, {
    fields: [quizOptions.questionId],
    references: [quizQuestions.id],
  }),
}));
