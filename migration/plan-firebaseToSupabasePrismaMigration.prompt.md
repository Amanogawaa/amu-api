# Firebase to Supabase + Prisma Migration Guide

**Project**: Amu API  
**Status**: Planning & Pre-Implementation  
**Timeline**: 5-6 days  
**Last Updated**: March 31, 2026

## 📋 Table of Contents

1. [Overview](#overview)
2. [Migration Phases](#migration-phases)
3. [Database Schema Mapping](#database-schema-mapping)
4. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
5. [Code Migration Patterns](#code-migration-patterns)
6. [Testing Strategy](#testing-strategy)
7. [Deployment & Cutover](#deployment--cutover)
8. [Rollback Plan](#rollback-plan)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Overview

### Motivation

- **Cost**: Supabase PostgreSQL offers better pricing at scale vs. Firestore
- **Flexibility**: SQL provides better control over complex queries and transactions
- **Ecosystem**: Prisma ORM reduces boilerplate and provides type safety
- **Performance**: PostgreSQL search & pagination optimization

### Current State

- **Backend Runtime**: Bun
- **Current Database**: Firebase Firestore (NoSQL)
- **Current Auth**: Firebase Authentication
- **Features**: 16 collections, 15 repositories, ~55-60 files using Firebase
- **Complexity**: Moderate (no real-time listeners, no transactions needed, simple batch operations)

### Target State

- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Auth**: Firebase Auth (kept) or Supabase Auth (optional)
- **Architecture**: Same Container → Repository → Service → Controller pattern
- **DI Model**: Minimal changes, database driver swaps via constructor injection

### Key Benefits

✅ Type-safe database queries  
✅ Automated migrations  
✅ Easy schema versioning  
✅ Better performance for complex queries  
✅ Cleaner transaction handling

---

## Migration Phases

| Phase | Title                 | Duration | Days    | Key Deliverable                      |
| ----- | --------------------- | -------- | ------- | ------------------------------------ |
| 1     | Setup & Configuration | 1 day    | Day 1   | Supabase project, Prisma initialized |
| 2     | Schema Design         | 1 day    | Day 1-2 | `schema.prisma` completed            |
| 3     | Data Migration        | 1 day    | Day 2   | All data exported & loaded           |
| 4     | Repository Layer      | 1.5 days | Day 2-3 | All 15 repositories rewritten        |
| 5     | Services & Middleware | 1 day    | Day 3-4 | Transaction logic updated            |
| 6     | Testing               | 1 day    | Day 4-5 | All E2E tests passing                |
| 7     | Deployment            | 1 day    | Day 5-6 | Production cutover                   |

---

## Database Schema Mapping

### Collections → Prisma Models

| Firestore Collection  | SQL Table              | Purpose                | Relationships                |
| --------------------- | ---------------------- | ---------------------- | ---------------------------- |
| `courses`             | `courses`              | Course metadata        | 1:N → chapters               |
| `chapters`            | `chapters`             | Chapter content        | 1:N → lessons, N:1 ← courses |
| `lessons`             | `lessons`              | Lesson content         | N:1 ← chapters               |
| `enrollments`         | `enrollments`          | User enrollment        | N:1 ← courses, users         |
| `users`               | `users`                | User profiles          | 1:N → enrollments            |
| `comments`            | `comments`             | Course comments        | N:1 ← courses, users         |
| `quizzes`             | `quizzes`              | Quiz definitions       | N:1 ← lessons                |
| `quiz_attempts`       | `quiz_attempts`        | Quiz responses         | N:1 ← quizzes, users         |
| `likes`               | `likes`                | Course likes           | N:1 ← courses, users         |
| `lesson_chats`        | `lesson_chats`         | Chat sessions          | N:1 ← lessons, users         |
| `chat_messages`       | `chat_messages`        | Chat messages          | N:1 ← lesson_chats, users    |
| `recommendations`     | `recommendations`      | Cached recommendations | N:1 ← users                  |
| `userStats`           | `user_stats`           | Leaderboard data       | N:1 ← users                  |
| `userProgress`        | `user_progress`        | Learning progress      | N:1 ← users, courses         |
| `capstoneGuidelines`  | `capstone_guidelines`  | Capstone requirements  | N:1 ← courses                |
| `capstoneSubmissions` | `capstone_submissions` | Submissions            | N:1 ← users, courses         |
| `capstoneReviews`     | `capstone_reviews`     | Review feedback        | N:1 ← submissions, users     |
| `capstoneLikes`       | `capstone_likes`       | Submission likes       | N:1 ← submissions, users     |

### Field Type Conversions

| Firebase Type    | Firestore Type       | SQL Type     | Prisma Type                 |
| ---------------- | -------------------- | ------------ | --------------------------- |
| String           | string               | VARCHAR(255) | String                      |
| Number           | number               | INT/DECIMAL  | Int / Float                 |
| Boolean          | boolean              | BOOLEAN      | Boolean                     |
| Timestamp        | Timestamp            | TIMESTAMP    | DateTime                    |
| Array            | array                | JSON         | Json / String[]             |
| Map/Object       | object               | JSON         | Json                        |
| Reference        | DocumentReference    | VARCHAR(255) | String (foreign key)        |
| Auto-ID          | Auto-generated       | UUID         | String @id @default(cuid()) |
| Server Timestamp | Timestamp.now()      | TIMESTAMP    | @default(now())             |
| Increment        | FieldValue.increment | INT          | {increment: n}              |

---

## Phase-by-Phase Implementation

### Phase 1: Setup & Configuration (Day 1)

#### 1.1 Create Supabase Project

**Prerequisites**:

- Supabase account (free at supabase.com)
- PostgreSQL 13+ (Supabase default)

**Steps**:

```bash
# 1. Create project at https://supabase.com/dashboard
# 2. Go to Settings > Database to get connection string
# 3. Format: postgresql://[user]:[password]@[host]:[port]/[database]
```

**Output**:

- Project URL
- API Key (anon/service role)
- Database connection string

#### 1.2 Install Prisma

```bash
# Install Prisma and client
bun add -D prisma
bun add @prisma/client

# Initialize Prisma
bunx prisma init

# This creates:
# - prisma/schema.prisma (database schema)
# - .env (environment variables)
```

#### 1.3 Configure Environment Variables

**Update `.env`**:

```env
# Existing Firebase vars (keep for transition period)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="..."
# ... other Firebase vars

# New Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Prisma
PRISMA_DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

**Update `tsconfig.json`** (ensure Prisma path aliases work):

```json
{
  "compilerOptions": {
    "paths": {
      "@prisma/*": ["./node_modules/@prisma/*"]
    }
  }
}
```

#### 1.4 Decision: Auth Strategy

**Option A**: Keep Firebase Auth ✅ **Recommended for minimal changes**

- No auth middleware changes
- Token verification stays the same
- User documents still in SQL for profile data

**Option B**: Migrate to Supabase Auth

- Full migration of user credentials
- Update middleware to use Supabase JWT
- Supab base handles auth service

**Recommendation**: Use **Option A** initially (lower risk), migrate auth later if needed.

---

### Phase 2: Schema Design (Days 1-2)

#### 2.1 Create Prisma Schema

**File**: `prisma/schema.prisma`

```prisma
// This file defines your entire database schema
// Generate Prisma Client from this schema
// Run migrations from this file

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgres"
  url      = env("DATABASE_URL")
}

// ==================== CORE MODELS ====================

model User {
  id                    String     @id @default(cuid())
  uid                   String     @unique // Firebase UID
  email                 String     @unique
  firstName             String?
  lastName              String?
  profilePicture        String?
  bio                   String?
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  // Relations
  enrollments           Enrollment[]
  comments              Comment[]
  likes                 Like[]
  recommendations       Recommendation?
  stats                 UserStats?
  progress              UserProgress[]
  quizAttempts          QuizAttempt[]
  lessonChats           LessonChat[]
  chatMessages          ChatMessage[]
  capstoneSubmissions   CapstoneSubmission[]
  capstoneReviews       CapstoneReview[]
  capstoneLikes         CapstoneL like[]

  @@index([uid])
  @@index([email])
}

model Course {
  id                    String     @id @default(cuid())
  uid                   String     // Author's Firebase UID
  name                  String     @db.VarChar(255)
  description           String?    @db.Text
  level                 String     // "beginner", "intermediate", "advanced"
  category              String?
  language              String?    @default("en")
  thumbnail             String?

  // Publishing
  publish               Boolean    @default(false)
  draft                 Boolean    @default(true)
  duration              Int?       // estimated minutes

  // Metadata
  commentCount          Int        @default(0)
  likeCount             Int        @default(0)
  enrollmentCount       Int        @default(0)

  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  // Relations
  chapters              Chapter[]
  enrollments           Enrollment[]
  comments              Comment[]
  likes                 Like[]
  progress              UserProgress[]
  guidelines            CapstoneGuideline?
  submissions           CapstoneSubmission[]

  @@index([uid])
  @@index([publish])
  @@index([level])
  @@index([name])
  @@fulltext([name, description]) // For full-text search
}

model Chapter {
  id                    String     @id @default(cuid())
  courseId              String
  chapterName           String
  description           String?    @db.Text
  order                 Int        @default(0)

  // Content index
  learningObjectives    String?    @db.Text // JSON stringified array
  keyTopics             String?    @db.Text // JSON stringified array

  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  // Relations
  course                Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons               Lesson[]

  @@unique([courseId, order])
  @@index([courseId])
}

model Lesson {
  id                    String     @id @default(cuid())
  chapterId             String
  lessonName            String
  lessonContent         String?    @db.Text
  estimatedDuration     Int?       // minutes
  order                 Int        @default(0)

  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  // Relations
  chapter               Chapter    @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  quizzes               Quiz[]
  chats                 LessonChat[]

  @@unique([chapterId, order])
  @@index([chapterId])
}

model Enrollment {
  id                    String     @id @default(cuid())
  courseId              String
  userId                String
  status                String     @default("enrolled") // "enrolled", "completed", "dropped"
  enrolledAt            DateTime   @default(now())
  completedAt           DateTime?

  // Relations
  course                Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([courseId, userId])
  @@index([userId])
  @@index([status])
}

model Comment {
  id                    String     @id @default(cuid())
  courseId              String
  authorId              String
  content               String     @db.Text
  parentId              String?    // For nested comments
  deleted               Boolean    @default(false)

  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  // Relations
  course                Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
  author                User       @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([courseId])
  @@index([authorId])
  @@index([parentId])
}

model Like {
  id                    String     @id @default(cuid())
  courseId              String
  userId                String
  createdAt             DateTime   @default(now())

  // Relations
  course                Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([courseId, userId])
  @@index([userId])
}

model Quiz {
  id                    String     @id @default(cuid())
  lessonId              String
  questions             String     @db.Text // JSON stringified
  passingScore          Int        @default(70)

  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  // Relations
  lesson                Lesson     @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  attempts              QuizAttempt[]

  @@unique([lessonId])
}

model QuizAttempt {
  id                    String     @id @default(cuid())
  quizId                String
  userId                String
  answers               String     @db.Text // JSON stringified
  score                 Int?
  passed                Boolean?

  attemptedAt           DateTime   @default(now())

  // Relations
  quiz                  Quiz       @relation(fields: [quizId], references: [id], onDelete: Cascade)
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([quizId])
  @@index([userId])
}

model LessonChat {
  id                    String     @id @default(cuid())
  lessonId              String
  userId                String
  courseId              String?
  chapterId             String?

  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  // Relations
  lesson                Lesson     @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages              ChatMessage[]

  @@index([userId])
  @@index([lessonId])
}

model ChatMessage {
  id                    String     @id @default(cuid())
  chatId                String
  userId                String
  role                  String     // "user", "assistant"
  content               String     @db.Text

  createdAt             DateTime   @default(now())

  // Relations
  chat                  LessonChat @relation(fields: [chatId], references: [id], onDelete: Cascade)
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([chatId])
  @@index([userId])
}

model Recommendation {
  id                    String     @id @default(cuid())
  userId                String     @unique
  type                  String     // "courses", "lessons"
  recommendations       String     @db.Text // JSON stringified
  expiresAt             DateTime

  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  // Relations
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([expiresAt])
}

model UserStats {
  id                    String     @id @default(cuid())
  userId                String     @unique
  totalScore            Int        @default(0)
  achievementCount      Int        @default(0)
  rank                  Int?
  badges                String     @db.Text // JSON stringified

  updatedAt             DateTime   @updatedAt

  // Relations
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UserProgress {
  id                    String     @id @default(cuid())
  userId                String
  courseId              String
  lessonsCompleted      Int        @default(0)
  completionPercentage  Int        @default(0)
  lastAccessedAt        DateTime?

  updatedAt             DateTime   @updatedAt

  // Relations
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  course                Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([courseId])
}

model CapstoneGuideline {
  id                    String     @id @default(cuid())
  courseId              String     @unique
  guidelines            String     @db.Text
  rubric                String?    @db.Text

  updatedAt             DateTime   @updatedAt

  // Relations
  course                Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
}

model CapstoneSubmission {
  id                    String     @id @default(cuid())
  courseId              String
  userId                String
  githubRepoUrl         String?
  projectDescription    String?    @db.Text
  submittedAt           DateTime   @default(now())

  likeCount             Int        @default(0)

  // Relations
  course                Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviews               CapstoneReview[]
  likes                 CapstoneL like[]

  @@unique([courseId, userId])
  @@index([userId])
}

model CapstoneReview {
  id                    String     @id @default(cuid())
  submissionId          String
  reviewerId            String
  feedback              String     @db.Text
  rating                Int?       // 1-5

  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  // Relations
  submission            CapstoneSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  reviewer              User       @relation(fields: [reviewerId], references: [id], onDelete: Cascade)

  @@index([submissionId])
  @@index([reviewerId])
}

model CapstoneL like {
  id                    String     @id @default(cuid())
  submissionId          String
  userId                String
  createdAt             DateTime   @default(now())

  // Relations
  submission            CapstoneSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([submissionId, userId])
  @@index([userId])
}
```

#### 2.2 Create Initial Migration

```bash
# Generate migration files
bunx prisma migrate dev --name init

# This creates:
# - prisma/migrations/[timestamp]_init/migration.sql
# - Pushes schema to Supabase database
```

#### 2.3 Key Indexes for Performance

Add to `schema.prisma` for commonly searched fields:

```prisma
// In Course model
@@fulltext([name, description])  // For LIKE searches
@@index([name])                   // For sorting
@@index([publish, createdAt])     // For listing
```

---

### Phase 3: Data Migration (Day 2)

#### 3.1 Export Data from Firebase

**File**: `scripts/export-firebase.ts`

```typescript
import admin from "firebase-admin";

async function exportCollections() {
  const collections = [
    "users",
    "courses",
    "chapters",
    "lessons",
    "enrollments",
    "comments",
    "quizzes",
    "quiz_attempts",
    "likes",
    "lesson_chats",
    "chat_messages",
    "recommendations",
    "userStats",
    "userProgress",
    "capstoneGuidelines",
    "capstoneSubmissions",
    "capstoneReviews",
    "capstoneLikes",
  ];

  const firestore = admin.firestore();
  const data: Record<string, any[]> = {};

  for (const collection of collections) {
    console.log(`Exporting ${collection}...`);
    const snapshot = await firestore.collection(collection).get();
    data[collection] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Write to JSON file
  Bun.write("./exports/firebase-data.json", JSON.stringify(data, null, 2));
  console.log("Export complete");
}

exportCollections();
```

**Run**:

```bash
bun run scripts/export-firebase.ts
```

#### 3.2 Transform Data to SQL Format

**File**: `scripts/transform-data.ts`

```typescript
import { readFileSync, writeFileSync } from "fs";

function transformData() {
  const rawData = JSON.parse(
    readFileSync("./exports/firebase-data.json", "utf-8"),
  );
  const transformed: Record<string, any[]> = {};

  // Example: Transform users
  transformed.users = rawData.users.map((user: any) => ({
    id: user.id || generateId(),
    uid: user.uid,
    email: user.email,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    profilePicture: user.profilePicture || null,
    bio: user.bio || null,
    createdAt: user.createdAt?.toDate?.() || new Date(),
    updatedAt: user.updatedAt?.toDate?.() || new Date(),
  }));

  // Transform courses
  transformed.courses = rawData.courses.map((course: any) => ({
    id: course.id,
    uid: course.uid,
    name: course.name,
    description: course.description || null,
    level: course.level || "beginner",
    category: course.category || null,
    language: course.language || "en",
    thumbnail: course.thumbnail || null,
    publish: course.publish || false,
    draft: course.draft || true,
    duration: course.duration || null,
    commentCount: course.commentCount || 0,
    likeCount: course.likeCount || 0,
    enrollmentCount: course.enrollmentCount || 0,
    createdAt: course.createdAt?.toDate?.() || new Date(),
    updatedAt: course.updatedAt?.toDate?.() || new Date(),
  }));

  // ... repeat for other collections

  writeFileSync(
    "./exports/transformed-data.json",
    JSON.stringify(transformed, null, 2),
  );
  console.log("Transform complete");
}

transformData();
```

#### 3.3 Seed Database

**File**: `prisma/seed.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(
    readFileSync("./exports/transformed-data.json", "utf-8"),
  );

  console.log("Seeding users...");
  for (const user of data.users) {
    await prisma.user.create({ data: user });
  }

  console.log("Seeding courses...");
  for (const course of data.courses) {
    await prisma.course.create({ data: course });
  }

  // ... continue for other models

  console.log("Seeding complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Update `package.json`**:

```json
{
  "prisma": {
    "seed": "bun run prisma/seed.ts"
  }
}
```

**Run seed**:

```bash
bunx prisma db seed
```

#### 3.4 Verification

```typescript
// Quick count check
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  console.log("Users:", await prisma.user.count());
  console.log("Courses:", await prisma.course.count());
  console.log("Enrollments:", await prisma.enrollment.count());
  // ... etc
}
```

---

### Phase 4: Repository Layer Rewrite (Days 2-3)

#### 4.1 Create Database Config

**File**: `src/config/database.ts` (NEW)

```typescript
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
```

#### 4.2 Rewrite Repositories (Priority Order)

**Priority 1 - Least Dependencies**: `user`, `likes`, `userStats`  
**Priority 2 - Medium**: `comments`, `quiz`, `progress`  
**Priority 3 - Complex**: `course`, `lesson`, `chapter`, `recommendations`

##### Example: User Repository

**Before (Firebase)**:

```typescript
export class UserRepository {
  async getUserById(uid: string) {
    const user = await db.collection("users").doc(uid).get();
    return user.exists ? user.data() : null;
  }

  async createUser(data: CreateUserDTO) {
    const docRef = await db.collection("users").add(data);
    return { id: docRef.id, ...data };
  }

  async updateUser(uid: string, data: UpdateUserDTO) {
    await db.collection("users").doc(uid).update(data);
    return this.getUserById(uid);
  }

  async deleteUser(uid: string) {
    await db.collection("users").doc(uid).delete();
  }
}
```

**After (Prisma)**:

```typescript
import { prisma } from "@config/database";
import type { User } from "@prisma/client";

export class UserRepository {
  async getUserById(uid: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { uid },
    });
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    return prisma.user.create({
      data: {
        uid: data.uid,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
  }

  async updateUser(uid: string, data: UpdateUserDTO): Promise<User | null> {
    return prisma.user.update({
      where: { uid },
      data,
    });
  }

  async deleteUser(uid: string): Promise<void> {
    await prisma.user.delete({
      where: { uid },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }
}
```

#### 4.3 Query Translation Table

| Firebase                                                                           | Prisma                                                                                   | Notes            |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------- |
| `db.collection("courses").get()`                                                   | `prisma.course.findMany()`                                                               | Fetch all        |
| `db.collection("courses").doc(id).get()`                                           | `prisma.course.findUnique({ where: { id } })`                                            | Single by ID     |
| `db.collection("courses").where("uid", "==", uid).get()`                           | `prisma.course.findMany({ where: { uid } })`                                             | Find by field    |
| `db.collection("courses").where("name", ">=", "A").where("name", "<=", "Z\uf8ff")` | `prisma.course.findMany({ where: { name: { contains: "text", mode: "insensitive" } } })` | Search           |
| `db.collection("courses").orderBy("createdAt", "desc").limit(10)`                  | `prisma.course.findMany({ orderBy: { createdAt: "desc" }, take: 10 })`                   | Order + limit    |
| `db.collection("courses").offset(20).limit(10)`                                    | `prisma.course.findMany({ skip: 20, take: 10 })`                                         | Pagination       |
| `FieldValue.increment(1)`                                                          | `{ increment: 1 }`                                                                       | Atomic increment |
| `batch.set()` / `batch.commit()`                                                   | `prisma.$transaction([...operations])`                                                   | Transactions     |

#### 4.4 Handling Complex Patterns

**Pattern: Atomic Increment**

```typescript
// Firebase
await db
  .collection("courses")
  .doc(courseId)
  .update({
    commentCount: admin.firestore.FieldValue.increment(1),
  });

// Prisma
await prisma.course.update({
  where: { id: courseId },
  data: {
    commentCount: {
      increment: 1,
    },
  },
});
```

**Pattern: Batch Operations**

```typescript
// Firebase
const batch = db.batch();
batch.set(doc1, data1);
batch.set(doc2, data2);
await batch.commit();

// Prisma
await prisma.$transaction([
  prisma.comment.create({ data: comment }),
  prisma.course.update({
    where: { id: courseId },
    data: { commentCount: { increment: 1 } },
  }),
]);
```

**Pattern: Search Query**

```typescript
// Firebase range search
db.collection("courses")
  .where("name", ">=", searchTerm)
  .where("name", "<=", searchTerm + "\uf8ff")
  .get();

// Prisma ILIKE (case-insensitive like)
prisma.course.findMany({
  where: {
    name: {
      contains: searchTerm,
      mode: "insensitive",
    },
  },
});
```

#### 4.5 Implementation Order & Dependencies

```
Day 2:
  ├─ User Repository ✓ (no dependencies)
  ├─ UserStats Repository ✓
  └─ Likes Repository ✓

Day 2-3:
  ├─ Comments Repository (depends on: User, Course)
  ├─ Quiz Repository (depends on: Lesson)
  ├─ Progress Repository (depends on: User, Course)
  └─ Enrollment Repository (depends on: User, Course)

Day 3:
  ├─ Lesson Repository (depends on: Chapter)
  ├─ Chapter Repository (depends on: Course)
  └─ Course Repository ★ (most complex - depends on most others)
```

---

### Phase 5: Services & Middleware (Days 3-4)

#### 5.1 Update `generation.service.ts`

**Key Change**: Replace batch writes with Prisma transactions

```typescript
// Before: Firebase batch operations
const batch = db.batch();
coursesData.forEach((course) => {
  batch.set(db.collection("courses").doc(), course);
});
await batch.commit();

// After: Prisma transactions
await prisma.$transaction(
  coursesData.map((course) => prisma.course.create({ data: course })),
);
```

#### 5.2 Update Middleware

**Auth Middleware** - No changes needed if using Firebase Auth

```typescript
// src/middlewares/auth.middleware.ts remains the same
// Still uses firebaseAuth.verifyIdToken()
```

**Ownership Middleware** - Update to use Prisma

```typescript
// Before
const courseData = (await db.collection("courses").doc(courseId).get()).data();

// After
const courseData = await prisma.course.findUnique({
  where: { id: courseId },
});
```

#### 5.3 Container Updates

Containers don't need major changes since they're already using DI, just ensure database injection:

```typescript
export class CourseContainer {
  public readonly repository: CourseRepository;
  public readonly service: CourseService;
  public readonly controller: CourseController;
  public readonly routes: CourseRoute;

  constructor() {
    this.repository = new CourseRepository(); // Uses prisma from config/database
    this.service = new CourseService(this.repository);
    this.controller = new CourseController(this.service);
    this.routes = new CourseRoute(this.controller);
  }
}
```

---

### Phase 6: Testing (Days 4-5)

#### 6.1 Unit Tests for Repositories

```typescript
// Example: tests/repositories/user.repository.test.ts
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PrismaClient } from "@prisma/client";
import { UserRepository } from "@features/user/repository";

const prisma = new PrismaClient();
const repo = new UserRepository();

describe("UserRepository", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create a user", async () => {
    const user = await repo.createUser({
      uid: "test-uid-1",
      email: "test@example.com",
      firstName: "Test",
    });
    expect(user).toBeDefined();
    expect(user.uid).toBe("test-uid-1");
  });

  it("should find user by uid", async () => {
    const user = await repo.getUserById("test-uid-1");
    expect(user).toBeDefined();
    expect(user?.email).toBe("test@example.com");
  });

  it("should update user", async () => {
    const updated = await repo.updateUser("test-uid-1", {
      firstName: "Updated",
    });
    expect(updated?.firstName).toBe("Updated");
  });
});
```

#### 6.2 E2E Tests for Features

```typescript
// Example: tests/e2e/course.e2e.test.ts
import { describe, it, expect, beforeAll, afterAll } from "bun:test";

describe("Course API E2E", () => {
  let courseId: string;
  let authToken: string;

  beforeAll(async () => {
    // Get auth token
    authToken = await getTestAuthToken();
  });

  it("should create a course", async () => {
    const response = await fetch("http://localhost:8080/api/courses", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({
        name: "Test Course",
        level: "beginner",
      }),
    });
    expect(response.status).toBe(201);
    const data = await response.json();
    courseId = data.id;
  });

  it("should fetch course by id", async () => {
    const response = await fetch(
      `http://localhost:8080/api/courses/${courseId}`,
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("Test Course");
  });

  it("should update course", async () => {
    const response = await fetch(
      `http://localhost:8080/api/courses/${courseId}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ name: "Updated Course" }),
      },
    );
    expect(response.status).toBe(200);
  });
});
```

#### 6.3 Performance Benchmarks

```typescript
// scripts/benchmark.ts
import { prisma } from "@config/database";

async function benchmark() {
  console.time("Fetch 100 courses");
  await prisma.course.findMany({ take: 100 });
  console.timeEnd("Fetch 100 courses");

  console.time("Search courses");
  await prisma.course.findMany({
    where: { name: { contains: "javascript", mode: "insensitive" } },
  });
  console.timeEnd("Search courses");

  console.time("Get user with relations");
  await prisma.user.findUnique({
    where: { id: "test-id" },
    include: {
      enrollments: true,
      stats: true,
    },
  });
  console.timeEnd("Get user with relations");
}

benchmark();
```

#### 6.4 Data Integrity Checks

```typescript
// scripts/verify-data.ts
async function verify() {
  const results = {
    users: await prisma.user.count(),
    courses: await prisma.course.count(),
    enrollments: await prisma.enrollment.count(),
    // ... etc
  };

  // Check foreign key integrity
  const orphanedEnrollments = await prisma.enrollment.findMany({
    where: {
      course: null,
    },
  });

  if (orphanedEnrollments.length > 0) {
    console.error(
      "⚠️  Orphaned enrollments found:",
      orphanedEnrollments.length,
    );
  } else {
    console.log("✅ All foreign keys valid");
  }

  console.log("🗄️  Data Summary:", results);
}
```

---

### Phase 7: Deployment & Cutover (Days 5-6)

#### 7.1 Pre-Deployment Checklist

- [ ] All repositories rewritten and tested
- [ ] All E2E tests passing
- [ ] Performance benchmarks acceptable
- [ ] Database backup taken
- [ ] Rollback procedure documented
- [ ] Staging environment mirrors production data
- [ ] Monitoring alerts configured

#### 7.2 Deployment Steps

**Step 1: Deploy to Staging**

```bash
# Checkout migration branch
git checkout -b firebase-to-supabase

# Deploy to staging environment
git push origin firebase-to-supabase

# Verify staging deployment
curl https://staging-api.example.com/api/health
```

**Step 2: Full Staging Test**

```bash
# Run full test suite
bun run test

# Run E2E tests against staging
TEST_ENV=staging bun run test:e2e

# Performance check
bun run scripts/benchmark.ts

# Data integrity verification
bun run scripts/verify-data.ts
```

**Step 3: Production Cutover**

```bash
# Schedule maintenance window (low traffic time)
# Notify users of 30-min maintenance

# Step 1: Set connection string to read-only
# Step 2: Final Firebase export
# Step 3: Load to Supabase
# Step 4: Switch connection string to Supabase
# Step 5: Run health checks

# Monitor for 1 hour
# Keep Firebase as fallback backup
```

#### 7.3 Connection String Management

**Before Cutover**:

```env
DATABASE_URL=postgresql://... # Supabase (pre-populated)
FIREBASE_ENABLED=true
```

**During Cutover**:

```env
DATABASE_URL=postgresql://... # Switch to production Supabase
FIREBASE_FALLBACK_ENABLED=true # Keep for 2 weeks
```

**After 2 Weeks**:

```env
DATABASE_URL=postgresql://...
FIREBASE_FALLBACK_ENABLED=false # Archive Firebase data
```

#### 7.4 Post-Deployment Monitoring

Monitor for 24 hours:

```typescript
// scripts/monitor.ts
async function monitorHealth() {
  setInterval(async () => {
    try {
      const health = await fetch(`${API_URL}/api/health`);
      const errors = await prisma.$queryRaw`
        SELECT level, message, COUNT(*) as count 
        FROM system_logs 
        WHERE created_at > NOW() - INTERVAL '1 hour'
        GROUP BY level, message
      `;
      console.log("✅ API Health:", await health.json());
      console.log("📊 Recent Errors:", errors);
    } catch (e) {
      console.error("❌ Monitoring failed:", e);
    }
  }, 60000); // Every 60 seconds
}
```

---

## Code Migration Patterns

### Search Queries

**Pattern: Substring Search**

```typescript
// Firebase
const results = await db
  .collection("courses")
  .where("name", ">=", query)
  .where("name", "<=", query + "\uf8ff")
  .get();

// Prisma
const results = await prisma.course.findMany({
  where: {
    name: {
      contains: query,
      mode: "insensitive", // Case-insensitive
    },
  },
});

// Or using full-text search (faster for large datasets)
const results = await prisma.$queryRaw`
  SELECT * FROM courses
  WHERE to_tsvector(name || ' ' || description)
    @@ plainto_tsquery($1)
  LIMIT 20
`;
```

### Pagination

**Pattern: Offset-Based (Simple)**

```typescript
// Firebase
const results = await db
  .collection("courses")
  .orderBy("createdAt", "desc")
  .offset(page * pageSize)
  .limit(pageSize)
  .get();

// Prisma
const results = await prisma.course.findMany({
  orderBy: { createdAt: "desc" },
  skip: page * pageSize,
  take: pageSize,
});

// Note: This performs poorly at large offsets
```

**Pattern: Cursor-Based (Recommended)**

```typescript
// Prisma - Better performance
const results = await prisma.course.findMany({
  orderBy: { createdAt: "desc" },
  take: pageSize,
  ...(cursor && { skip: 1, cursor: { id: cursor } }),
});
```

### Relationships

**Pattern: Include Related Data**

```typescript
// Firebase - Multiple queries
const course = (await db.collection("courses").doc(courseId).get()).data();
const chapters = (
  await db.collection("chapters").where("courseId", "==", courseId).get()
).docs.map((d) => d.data());

// Prisma - Single query
const course = await prisma.course.findUnique({
  where: { id: courseId },
  include: {
    chapters: true,
    enrollments: true,
    comments: true,
  },
});
```

### Transactions

**Pattern: Multi-Document Update**

```typescript
// Firebase
const batch = db.batch();
batch.update(docRef1, data1);
batch.update(docRef2, data2);
await batch.commit();

// Prisma
await prisma.$transaction([
  prisma.model1.update({ where: { id: id1 }, data: data1 }),
  prisma.model2.update({ where: { id: id2 }, data: data2 })
]);

// With rollback on error
try {
  await prisma.$transaction([...]);
} catch (e) {
  // Automatic rollback
  console.error("Transaction failed", e);
}
```

---

## Testing Strategy

### Test Hierarchy

```
┌─────────────────────────────────────┐
│   E2E Tests (API endpoints)         │  5-10%
│   Full workflow, external requests  │
└────────────┬────────────────────────┘
             │
┌────────────┴────────────────────────┐
│   Integration Tests (Services)      │  20-30%
│   Multiple components, with DB      │
└────────────┬────────────────────────┘
             │
┌────────────┴────────────────────────┐
│   Unit Tests (Repositories)         │  60-70%
│   Isolated, with mocked DB          │
└─────────────────────────────────────┘
```

### Running Tests

```bash
# Unit tests only
bun run test:unit

# Integration tests
bun run test:integration

# E2E tests
bun run test:e2e

# Full test suite
bun run test

# With coverage
bun run test --coverage
```

---

## Rollback Plan

### If Issues Arise

**Scenario 1: Data Corruption**

```
1. Stop all API instances
2. Switch DATABASE_URL to Firebase fallback
3. Verify Firebase operations working
4. Investigate root cause
5. Re-migrate data after fix
```

**Scenario 2: Performance Degradation**

```
1. Add missing database index
2. Rerun benchmarks
3. If still slow: optimize queries with EXPLAIN ANALYZE
4. Last resort: rollback to Firebase
```

**Scenario 3: Auth Token Verification Fails**

```
1. Check middleware chain
2. Verify Prisma client initialization
3. Clear any cached connections
4. Restart API server
```

### Keeping Firebase Safe

For 2 weeks post-migration:

```bash
# Disable writes to Firebase
FIREBASE_WRITE_ENABLED=false

# But keep read capability for verification
FIREBASE_READ_ENABLED=true

# After 2 weeks: Archive Firebase data
# - Export all collections
# - Store in cold storage
# - Delete project (optional)
```

---

## Troubleshooting

### Common Issues & Solutions

**Issue**: "Prisma Client initialization failed"

```
Solution:
1. Check DATABASE_URL in .env
2. Verify Supabase connection string format
3. Run: bunx prisma db push
4. Restart server
```

**Issue**: "Foreign key constraint violation"

```
Solution:
1. Check data load order (parent before child)
2. Verify all UIDs exist in users table
3. Run data integrity:
   - bunx prisma db seed --force-reset
```

**Issue**: "Search queries too slow"

```
Solution:
1. Add index: CREATE INDEX idx_courses_name ON courses (name)
2. Use full-text search for large datasets
3. Add pagination limits
4. Run: EXPLAIN ANALYZE SELECT ...
```

**Issue**: "Transactions failing intermittently"

```
Solution:
1. Increase transaction timeout in schema
2. Reduce operations per transaction
3. Add retry logic in service layer
4. Check for long-running queries
```

---

## FAQ

### Q: Can I keep Firebase Auth while migrating database?

**A**: Yes! This is the recommended approach for Phase 1. Firebase Auth is independent of Firestore, so:

- Keep Firebase Auth service running
- Database layer uses Supabase PostgreSQL via Prisma
- Auth middleware unchanged
- User profile data stored in SQL

### Q: How long will the cutover take?

**A**: Typically 30-60 minutes:

- 10 min: Stop writes, export data
- 10 min: Load data to Supabase
- 10 min: Switch connection string
- 20 min: Monitor for errors
- Emergency rollback: <5 min if needed

### Q: Will there be downtime?

**A**: Yes, 30-60 min maintenance window. To minimize:

- Use read replicas during migration
- Migrate during off-peak hours
- Test all steps in staging first
- Have rollback procedure ready

### Q: What if I need to rollback immediately?

**A**: Rollback procedure:

```
1. Switch DATABASE_URL back to Firebase
2. Restart API server
3. Disable Prisma client
4. Re-enable Firebase Admin SDK
5. Verify API responding
Total time: <5 minutes
```

### Q: How do I handle partial failures during cutover?

**A**: Use transactions for atomic operations:

```typescript
await prisma.$transaction(
  [
    // If any fails, all rollback
    prisma.course.create({ data: course1 }),
    prisma.chapter.create({ data: chapter1 }),
    prisma.lesson.create({ data: lesson1 }),
  ],
  {
    timeout: 10000, // 10 second timeout
  },
);
```

### Q: Can I migrate one feature at a time?

**A**: Not easily, since features share data. Better approach:

1. Migrate all data at once
2. Deploy new repository layer for all features
3. Switch connection string globally
4. Verify all features work
5. Archive Firebase

### Q: What about real-time features (Socket.IO)?

**A**: Socket.IO works unchanged:

- Still uses Socket.IO for events
- Data layer now uses Prisma instead of Firebase
- Socket handlers get data from Prisma
- No changes to event handling logic

### Q: Do I need to reindex everything?

**A**: PostgreSQL creates indexes automatically for:

- Primary keys (`@id`)
- Unique fields (`@unique`)
- Foreign keys (`@relation`)

Add manual indexes for frequently searched fields:

```prisma
model Course {
  name String
  @@index([name])  // For LIKE searches
}
```

---

## Appendix: File Checklist

### Files to Create

- [ ] `src/config/database.ts`
- [ ] `prisma/schema.prisma`
- [ ] `prisma/seed.ts`
- [ ] `scripts/export-firebase.ts`
- [ ] `scripts/transform-data.ts`
- [ ] `scripts/verify-data.ts`
- [ ] `scripts/benchmark.ts`
- [ ] `scripts/monitor.ts`
- [ ] `tests/repositories/user.repository.test.ts`
- [ ] `tests/e2e/course.e2e.test.ts`

### Files to Update

- [ ] `package.json` - Add dependencies
- [ ] `.env` - Add DATABASE_URL
- [ ] `tsconfig.json` - Prisma paths
- [ ] All `src/features/*/repository.ts` (15 files)
- [ ] `src/utils/service/generation.service.ts`
- [ ] `src/middlewares/ownership.middle.ts`
- [ ] `nodemon.json` - Add Prisma events
- [ ] `.gitignore` - Add prisma/

### Files to Keep (No changes)

- [ ] `src/config/firebase.ts` (for auth)
- [ ] `src/middlewares/auth.middleware.ts`
- [ ] All service and controller files
- [ ] All routes files

---

## Success Criteria

✅ **Data Integrity**

- No records lost
- All foreign keys valid
- Timestamps preserved

✅ **Performance**

- Search queries < 100ms
- Pagination < 50ms
- API response time comparable to Firebase

✅ **Functionality**

- All E2E tests passing
- User workflows unchanged
- Zero API errors in production

✅ **Deployment**

- Successful cutover with rollback ready
- Monitoring in place
- Firebase archived

---

## Timeline Summary

| Day | Phase                             | Duration |
| --- | --------------------------------- | -------- |
| 1   | Setup + Schema Design             | 1 day    |
| 2   | Data Migration + Repository Start | 1 day    |
| 2-3 | Repository Layer Completion       | 1.5 days |
| 3-4 | Services & Testing                | 1.5 days |
| 5   | Final E2E & Staging Deployment    | 1 day    |
| 5-6 | Production Cutover                | 1 day    |

**Total: ~5-6 business days**

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Supabase PostgreSQL Guide](https://supabase.com/docs/guides/database)
- [Bun Package Manager](https://bun.sh/docs)
- [Firebase to PostgreSQL Migration Patterns](https://cloud.google.com/migrate/partners/ibm)
- Project repo: [github.com/your-org/amu-api](https://github.com)

---

**Created**: March 31, 2026  
**Status**: Ready for Phase 1  
**Next Step**: Create Supabase project and set up Prisma
