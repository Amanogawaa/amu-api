# Amu API - AI Coding Agent Instructions

## Project Overview

Backend API for an AI-powered learning platform built with **Bun runtime**, Express, Firebase, and Google Gemini AI. The API generates intelligent course content (courses, chapters, lessons) using structured AI prompts with schema validation.

## Architecture Pattern: Container-Based Dependency Injection

Every feature follows a strict **Container → Repository → Service → Controller → Route** pattern:

```typescript
// Example: features/course/container.ts
export class CourseContainer {
  public readonly repository: CourseRepository; // Firestore data layer
  public readonly service: CourseService; // Business logic + AI calls
  public readonly controller: CourseController; // HTTP handlers
  public readonly routes: CourseRoute; // Route definitions + OpenAPI docs
}
```

**Key principle**: Containers are instantiated in [src/app.ts](src/app.ts) and passed to [AppRoutes](src/routes.ts). Dependencies flow downward through constructor injection.

## Adding a New Feature

1. Create `src/features/your-feature/` with these files (all required):
   - `container.ts` - DI container
   - `repository.ts` - Firestore operations
   - `service.ts` - Business logic
   - `controller.ts` - Request/response handlers
   - `route.ts` - Express routes with OpenAPI JSDoc comments
   - `types.ts` - TypeScript interfaces + Zod schemas
   - `validation.ts` - Input validation middleware

2. Register in [src/app.ts](src/app.ts) constructor:

   ```typescript
   private yourFeatureContainer: YourFeatureContainer;
   // ...
   this.yourFeatureContainer = new YourFeatureContainer();
   ```

3. Pass to AppRoutes in [src/routes.ts](src/routes.ts) and mount routes.

## Development Workflow

- **Run dev server**: `bun run dev` (uses nodemon with hot reload)
- **Run production**: `bun run src/server.ts`
- **Lint**: `bun run eslint-check-only` or `bun run eslint-fix`
- **API docs**: `http://localhost:8080/api/docs` (Swagger UI)

**Critical**: Bun is the primary runtime. Do not run `npm install` or `node` commands.

## Type System & Validation

- **Path aliases** (tsconfig.json): `@features/*`, `@utils/*`, `@config/*`
- **Zod schemas** in `types.ts` files define both TypeScript types AND AI response schemas
- Example from [features/course/types.ts](src/features/course/types.ts):
  ```typescript
  export const courseSchema = {
    type: "object",
    properties: { name: { type: "string" } /* ... */ },
  };
  ```

## AI Integration (Google Gemini)

All AI calls use [utils/geminiCall.ts](src/utils/geminiCall.ts) with **Bottleneck rate limiting**:

```typescript
const result = await geminiCall(userPrompt, {
  responseSchema: courseSchema, // Zod schema for structured output
  temperature: 0.7,
  maxRetries: 3,
  systemPrompt, // Optional system instructions
  benchmarkTag: "course:system", // For logging/monitoring
  metadata: { topic, level }, // Additional context
});
```

- Prompts live in `utils/prompts/` (e.g., `course-temp.ts`, `lesson-temp.ts`)
- Current model: `gemini-3-flash-preview` (configured in geminiCall.ts)
- **Schema validation**: AI responses MUST match the Zod schema or call fails

## Authentication & Authorization

1. **authMiddleware** ([middlewares/auth.middleware.ts](src/middlewares/auth.middleware.ts)):
   - Verifies Firebase ID token from `Authorization: Bearer <token>` header OR cookie
   - Attaches `req.user = { uid, email, ... }` to request
   - Use before ALL protected routes

2. **Ownership middleware** ([middlewares/ownership.middle.ts](src/middlewares/ownership.middle.ts)):
   - Example: `courseOwnershipMiddleware` checks `courseData.uid === req.user.uid`
   - Apply AFTER authMiddleware for user-specific resources

## Error Handling

- Use custom errors from [utils/errors.ts](src/utils/errors.ts):
  ```typescript
  throw new AppError("Course not found", 404);
  throw new ValidationError("Invalid input", { field: "message" });
  throw new ForbiddenError("Access denied");
  ```
- Global error handler in [middlewares/error.middleware.ts](src/middlewares/error.middleware.ts) catches all
- Always log with [utils/loggers.ts](src/utils/loggers.ts) (Pino logger)

## Firestore Data Access

- Firebase initialized in [config/firebase.ts](src/config/firebase.ts)
- Repositories access `firebaseFirestore.collection("courses").doc(id).get()`
- **Pattern**: Repositories return domain objects, not Firestore documents
- Query batching: For `in` queries, batch in chunks of 10 (Firestore limit)

## Real-time Features (Socket.IO)

- Initialized in [config/socket.ts](src/config/socket.ts)
- Auth middleware: [middlewares/socket.middleware.ts](src/middlewares/socket.middleware.ts)
- Handlers in `utils/socket/socket.handlers.ts`
- Typed events defined in `utils/socket/socket.types.ts`

## Environment & Configuration

- [config/environment.ts](src/config/environment.ts) exports validated `config` object
- [config/validation.ts](src/config/validation.ts) validates ALL required env vars at startup
- **Never access `process.env` directly** - use `config.*` instead
- Required vars: GEMINI*API_KEY, FIREBASE*\*, JWT_SECRET, NEXTJS_FRONTEND_URL

## Code Style & Conventions

- **No unused imports**: ESLint enforces strict rules
- **Bind controller methods**: `this.controller.getCourses.bind(this.controller)` in routes
- **OpenAPI docs**: Every route MUST have JSDoc `@openapi` comment (see [features/course/route.ts](src/features/course/route.ts))
- **Path imports**: Use TypeScript path aliases (`@features/auth/types`) not relative paths
- **Async/await**: Preferred over promises. Always handle errors with try/catch in services

## Common Patterns

**Route definition with middleware chain**:

```typescript
this.router.post(
  "/course",
  authMiddleware, // Authentication
  validateGenerateCourse, // Input validation
  validateCourseTopic, // Business validation
  checkDuplicateCourse, // Duplicate check
  this.controller.createCourse.bind(this.controller),
);
```

**Service with AI generation**:

```typescript
const { userPrompt, systemPrompt } = buildCoursePrompt(params, "system");
const result = await geminiCall(userPrompt, {
  responseSchema: courseSchema,
  temperature: 0.7,
  maxRetries: 3,
  systemPrompt,
  benchmarkTag: "course:system",
});
```

## Testing & Deployment

- Dockerized: See [Dockerfile](Dockerfile) and [podman-compose.yml](podman-compose.yml)
- Deployment docs: [DEPLOYMENT.md](DEPLOYMENT.md), [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
- Health check: Available via configured routes
