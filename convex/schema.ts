import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.string(),
    password: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    program: v.string(),
    year: v.number(),
    school: v.string(),
    photoURL: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    githubUsername: v.optional(v.string()),
    githubId: v.optional(v.string()),
    githubConnectedAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  courses: defineTable({
    userId: v.id("users"),
    topic: v.string(),
    level: v.string(),
    duration: v.string(),
    category: v.string(),
    language: v.string(),
    name: v.string(),
    description: v.string(),
    subtitle: v.optional(v.string()),
    targetAudience: v.string(),
    prerequisites: v.string(),
    noOfChapters: v.number(),
    skillsGained: v.array(v.string()),
    learning_outcomes: v.array(v.string()),
    publish: v.boolean(),
    draft: v.boolean(),
    supportsCodePlayground: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    nextCourses: v.optional(v.array(v.string())),
  })
    .index("by_name", ["name"])
    .index("by_category", ["category"]),

  chapters: defineTable({
    courseId: v.id("courses"),
    courseName: v.string(),
    chapterOrder: v.number(),
    chapterName: v.string(),
    chapterDescription: v.string(),
    estimatedDuration: v.string(),
    learningObjectives: v.array(v.string()),
    keyTopics: v.array(v.string()),
    prerequisites: v.array(v.string()),
    practicalApplication: v.string(),
    estimatedLessonCount: v.number(),
  })
    .index("by_courseId", ["courseId"])
    .index("by_courseId_chapterOrder", ["courseId", "chapterOrder"]),

  lessons: defineTable({
    chapterId: v.id("chapters"),
    courseId: v.id("courses"),
    lessonOrder: v.number(),
    lessonName: v.string(),
    type: v.string(),
    duration: v.string(),
    lessonDescription: v.string(),
    content: v.optional(v.string()),
    videoSearchQuery: v.optional(v.string()),
    selectedVideoId: v.optional(v.string()),
    videoTranscript: v.optional(v.string()),
    transcriptLanguage: v.optional(v.string()),
    transcriptFetchedAt: v.optional(v.string()),
    resources: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        type: v.string(),
        description: v.string(),
      }),
    ),
    learningOutcome: v.string(),
    prerequisites: v.array(v.string()),
    // might delete this later
    playgroundEnvironment: v.optional(
      v.object({
        type: v.string(), // "vanilla" | "frontend" | "backend" | "none"
        framework: v.optional(v.string()),
        dependencies: v.optional(v.array(v.string())),
        supportsExecution: v.boolean(),
        executionEngine: v.optional(v.string()), // "piston" | "judge0" | "sandpack" | "none"
        config: v.optional(
          v.object({
            template: v.optional(v.string()),
            files: v.optional(v.any()),
            buildCommand: v.optional(v.string()),
            runCommand: v.optional(v.string()),
          }),
        ),
      }),
    ),
  })
    .index("by_chapterId", ["chapterId"])
    .index("by_courseId", ["courseId"])
    .index("by_chapterId_lessonOrder", ["chapterId", "lessonOrder"]),

  enrollments: defineTable({
    courseId: v.string(),
    userId: v.string(), // user UID
    status: v.string(), // "active" | "completed" | "dropped"
    enrolledAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_courseId", ["courseId"])
    .index("by_userId", ["userId"])
    .index("by_userId_courseId", ["userId", "courseId"]),

  comments: defineTable({
    courseId: v.string(),
    authorId: v.string(), // user UID
    authorName: v.optional(v.string()),
    authorEmail: v.optional(v.string()),
    content: v.string(),
    parentId: v.optional(v.string()), // for nested comments
    deleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_courseId", ["courseId"])
    .index("by_authorId", ["authorId"]),

  likes: defineTable({
    courseId: v.string(),
    userId: v.string(), // user UID
    createdAt: v.number(),
  })
    .index("by_courseId", ["courseId"])
    .index("by_userId", ["userId"])
    .index("by_userId_courseId", ["userId", "courseId"]),

  progress: defineTable({
    userId: v.string(),
    courseId: v.string(),
    chapterId: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    status: v.string(), // "started" | "in_progress" | "completed"
    progress: v.number(), // 0-100
    lastAccessedAt: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_courseId", ["userId", "courseId"])
    .index("by_userId", ["userId"]),

  quiz: defineTable({
    lessonId: v.string(),
    chapterId: v.string(),
    courseId: v.string(),
    title: v.string(),
    description: v.string(),
    questions: v.array(
      v.object({
        id: v.string(),
        question: v.string(),
        type: v.string(), // "multiple_choice" | "true_false" | "short_answer"
        options: v.optional(v.array(v.string())),
        correctAnswer: v.optional(v.string()),
        correctAnswers: v.optional(v.array(v.string())),
        explanation: v.optional(v.string()),
        points: v.number(),
      }),
    ),
    totalPoints: v.number(),
    passingScore: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_lessonId", ["lessonId"])
    .index("by_courseId", ["courseId"]),

  quizSubmissions: defineTable({
    quizId: v.string(),
    userId: v.string(),
    courseId: v.string(),
    lessonId: v.string(),
    answers: v.array(
      v.object({
        questionId: v.string(),
        answer: v.string(),
        isCorrect: v.boolean(),
        pointsEarned: v.number(),
      }),
    ),
    totalScore: v.number(),
    maxScore: v.number(),
    passed: v.boolean(),
    submittedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_quizId_userId", ["quizId", "userId"])
    .index("by_userId", ["userId"]),

  leaderboards: defineTable({
    userId: v.string(),
    userName: v.optional(v.string()),
    totalPoints: v.number(),
    coursesCompleted: v.number(),
    quizzesCompleted: v.number(),
    rank: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rank", ["rank"])
    .index("by_totalPoints", ["totalPoints"]),

  capstone: defineTable({
    userId: v.string(),
    courseId: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.string(), // "draft" | "submitted" | "under_review" | "approved" | "rejected"
    submissionUrl: v.optional(v.string()),
    submittedAt: v.optional(v.number()),
    feedback: v.optional(v.string()),
    score: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()),
    media: v.array(
      v.object({
        url: v.string(),
        type: v.string(), // "image" | "video" | "document"
        uploadedAt: v.number(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_courseId", ["courseId"]),

  codePlayground: defineTable({
    userId: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    title: v.string(),
    language: v.string(), // "javascript" | "python" | "typescript" | etc
    code: v.string(),
    output: v.optional(v.string()),
    isPublic: v.boolean(),
    parentPlaygroundId: v.optional(v.string()), // for forks
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_lessonId", ["lessonId"]),

  recommendations: defineTable({
    userId: v.string(),
    courseId: v.string(),
    score: v.number(), // 0-1 recommendation score
    reason: v.string(), // why this was recommended
    recommendationType: v.string(), // "similar" | "skill_match" | "trending" | "personalized"
    viewedAt: v.optional(v.number()),
    enrolledAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_score", ["userId", "score"]),

  lessonAssistant: defineTable({
    lessonId: v.string(),
    userId: v.optional(v.string()), // null for public assistants
    conversation: v.array(
      v.object({
        role: v.string(), // "user" | "assistant"
        content: v.string(),
        timestamp: v.number(),
      }),
    ),
    context: v.optional(v.any()), // AI context/embeddings
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_lessonId", ["lessonId"])
    .index("by_userId", ["userId"]),
});
