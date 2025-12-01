# Amu API - AI Coding Agent Instructions

## Project Overview

TypeScript/Express API for an AI-powered learning management system. Uses Firebase Firestore for data, Google Gemini for course generation, and follows a strict layered architecture pattern.

## Architecture Pattern: Container-Based Dependency Injection

**Critical:** Every feature module (`src/features/*`) follows this exact structure:

```
feature/
  ├── container.ts     # DI container - instantiates all layers
  ├── route.ts         # Express routes with OpenAPI docs
  ├── controller.ts    # Request/response handling
  ├── service.ts       # Business logic
  ├── repository.ts    # Firebase Firestore operations
  ├── types.ts         # TypeScript interfaces & Zod schemas
  └── validation.ts    # Zod middleware validators
```

**Data flow:** Route → Controller → Service → Repository → Firestore

Example from `src/features/course/container.ts`:

```typescript
export class CourseContainer {
  constructor(firestore: Firestore = firebaseFirestore) {
    this.repository = new CourseRepository(firestore);
    this.service = new CourseService(this.repository);
    this.controller = new CourseController(this.service);
    this.routes = new CourseRoute(this.controller);
  }
  getRouter() {
    return this.routes.getRouter();
  }
}
```

## Route Registration (CRITICAL for avoiding 404s)

Routes are mounted at `/api` via this chain:

1. `src/app.ts`: `app.use('/api', this.appRoutes.getRouter())`
2. `src/routes.ts`: `AppRoutes` mounts containers at specific paths
3. `src/features/*/route.ts`: Individual route definitions

**Current route mappings in `AppRoutes`:**

- Auth: `this.router.use('/', authContainer.getRouter())` → `/api/auth/*`
- Courses: `this.router.use('/', courseContainer.getRouter())` → `/api/courses/*`

**Example:** Course routes define `this.router.get('/', ...)` which becomes `/api/courses` NOT `/api/courses/courses`.

## OpenAPI/Swagger Documentation

**Location:** All API docs generated from JSDoc comments in route files.

**Required format:**

```typescript
/**
 * @openapi
 * /courses:              # Path relative to /api
 *   get:
 *     tags: [Courses]
 *     summary: Brief description
 *     description: Detailed info
 *     parameters:        # For query/path params
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 */
```

**Common pitfall:** YAML colons in descriptions break parsing. Use block scalars:

```yaml
description: |
  Multi-line description
  Can include colons: like this
```

**Schema definitions:** Add to `src/config/swagger.ts` under `components.schemas`.

**Access docs:** `http://localhost:8080/api/docs`

## Firebase Integration

**Config:** `src/config/firebase.ts` exports:

- `firebaseAuth` - Authentication
- `firebaseFirestore` - Database
- `admin` - Full SDK

**Repository pattern:**

- Always inject Firestore instance in constructor
- Collection names as constants: `private readonly COLLECTION_NAME = 'courses'`
- Parse JSON fields on read: `learning_outcomes` stored as JSON string, return as array
- Add timestamps: `createdAt`, `updatedAt` as `new Date()`

Example query pattern:

```typescript
let query = this.firebaseStore.collection(this.COLLECTION_NAME);
if (params?.level) {
  query = query.where("level", "==", params.level) as any;
}
const snapshot = await query.get();
```

## AI Integration (Google Gemini)

**Centralized helper:** `src/utils/geminiCall.ts` handles all Gemini API calls.

**Usage pattern:**

```typescript
const result = await geminiCall(prompt, {
  responseSchema: courseSchema, // Zod schema for structured output
  temperature: 0.7,
  maxRetries: 3,
});
```

**Features:**

- Automatic retry with exponential backoff
- Structured JSON output via `responseSchema`
- Token usage logging
- Returns parsed JSON directly

**Prompts:** Stored in `src/utils/prompts/*-temp.ts`

## Error Handling

**Custom errors:** `src/utils/errors.ts` defines typed errors:

- `AppError(message, statusCode, code)` - Base class
- `ValidationError(message, fields)` - 400 with field details
- `UnauthorizedError()` - 401
- `UserNotFoundError()` - 404
- `ConflictError()` - 409

**Middleware:** `src/middlewares/error.middleware.ts` catches all errors, logs with request ID, and formats responses.

**Usage in services:**

```typescript
throw new AppError("Course not found", 404);
```

## Validation with Zod

**Pattern:** Define schema in `validation.ts`, export middleware:

```typescript
export const generateCourseSchema = z.object({
  category: z.string().min(2).max(50),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});

export const validateGenerateCourse = (req, res, next) => {
  try {
    generateCourseSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      );
    }
    next(error);
  }
};
```

Apply in routes: `this.router.post('/courses', validateGenerateCourse, ...)`

## Development Workflow

**Start dev server:**

```bash
bun run dev  # Uses nodemon with tsx, watches src/**/*.ts
```

**Environment:**

- Bun runtime (not Node.js)
- TypeScript with `moduleResolution: "bundler"`
- No build step - tsx transpiles on the fly

**Key files:**

- `nodemon.json`: Watch config, runs `tsx ./src/server.ts`
- `tsconfig.json`: Strict mode enabled, bundler resolution
- `src/server.ts`: Entry point, starts app on port 8080

## Logging

**Logger:** `src/utils/loggers.ts` uses Pino with pretty printing.

**Usage:**

```typescript
import { logger } from "../../utils/loggers";

logger.info("Message", { contextData });
logger.error("Error occurred:", error);
logger.warn("Warning:", { details });
```

Logs include timestamps, levels, and structured data.

## Adding New Features

1. Create folder: `src/features/new-feature/`
2. Implement: `types.ts` → `repository.ts` → `service.ts` → `controller.ts` → `route.ts` → `validation.ts`
3. Create container: `container.ts` wiring all layers
4. Register in `src/routes.ts`: Add to `AppRoutes` constructor and `initializeRoutes()`
5. Add schemas to `src/config/swagger.ts` if needed
6. Add OpenAPI docs to route methods

## Common Patterns

**Controller method structure:**

```typescript
async method(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await this.service.method(req.params.id);
    res.status(200).json({ data });
  } catch (error) {
    logger.error('Error in Controller.method:', error);
    next(error);  // Pass to error middleware
  }
}
```

**Binding in routes:** Always bind controller methods:

```typescript
this.router.get("/path", this.controller.method.bind(this.controller));
```

**Response format:** Return objects with metadata:

```typescript
res.status(200).send({
  results: data,
  count: total,
  next: hasNext ? offset + limit : null,
  previous: hasPrev ? offset - limit : null,
});
```
