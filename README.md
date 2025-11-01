# Amu API

Backend API for the Amu AI-powered learning platform. Built with Express, Bun runtime, Firebase Admin SDK, and Google Gemini AI for intelligent course content generation.

## 🚀 Quick Start

### Prerequisites

- **Bun** v1.2.23 or higher ([Install Bun](https://bun.sh))
- **Firebase Project** with Firestore and Authentication enabled
- **Google Gemini API Key**
- **Node.js** v20+ (for some development tools)

### Installation

```bash
# Install dependencies
bun install
```

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=8080

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Firebase Admin SDK Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_PROVIDER_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
FIREBASE_UNIVERSE_DOMAIN=googleapis.com

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Frontend URL (for CORS)
NEXTJS_FRONTEND_URL=http://localhost:3000

# Cookie Configuration (optional)
COOKIE_NAME=FIREBASE_COOKIE_JWT
```

> **Note**: The application validates all required environment variables at startup and will exit with detailed error messages if any are missing.

### Running the Application

```bash
# Development mode (with hot reload)
bun run dev

# Production mode
bun run src/server.ts
```

The API will be available at `http://localhost:8080/api`

### API Documentation

Interactive API documentation is available via Swagger UI:

```
http://localhost:8080/api/docs
```

## 📁 Project Structure

```
src/
├── app.ts                      # Express app configuration
├── server.ts                   # Server entry point
├── routes.ts                   # Route aggregator
├── config/
│   ├── environment.ts          # Environment variables configuration
│   ├── firebase.ts             # Firebase Admin SDK initialization
│   ├── swagger.ts              # Swagger/OpenAPI configuration
│   └── validation.ts           # Environment validation logic
├── features/                   # Feature-based modules
│   ├── auth/                   # Authentication & authorization
│   ├── course/                 # Course management & AI generation
│   ├── modules/                # Course modules management
│   ├── chapter/                # Chapter management & AI generation
│   └── lesson/                 # Lesson management & AI generation
├── middlewares/
│   ├── auth.middleware.ts      # JWT token verification
│   ├── error.middleware.ts     # Global error handler
│   └── ownership.middle.ts     # Resource ownership validation
└── utils/
    ├── errors.ts               # Custom error classes
    ├── geminiCall.ts           # Google Gemini AI integration
    ├── loggers.ts              # Pino logger configuration
    ├── sanitizer.ts            # Input sanitization utilities
    └── prompts/                # AI prompt templates
        ├── course-temp.ts
        ├── module-temp.ts
        ├── chapter-temp.ts
        └── lesson-temp.ts
```

## 🏗️ Architecture

### Container Pattern

Each feature follows a **dependency injection container pattern**:

```typescript
Container → Repository → Service → Controller → Routes
```

**Example: Course Feature**

```typescript
class CourseContainer {
  public readonly repository: CourseRepository; // Data layer (Firestore)
  public readonly service: CourseService; // Business logic + AI
  public readonly controller: CourseController; // HTTP handling
  public readonly routes: CourseRoute; // Route definitions
}
```

### Adding a New Feature

1. **Create feature directory**: `src/features/your-feature/`
2. **Create required files**:
   - `container.ts` - Dependency injection container
   - `repository.ts` - Database operations
   - `service.ts` - Business logic
   - `controller.ts` - HTTP request/response handling
   - `route.ts` - Route definitions with OpenAPI docs
   - `types.ts` - TypeScript interfaces and Zod schemas
   - `validation.ts` - Input validation middleware
3. **Register in `app.ts`**: Add container to constructor
4. **Register in `routes.ts`**: Add routes to router

### Authentication Flow

1. Client sends Firebase ID token in `Authorization: Bearer <token>` header
2. `authMiddleware.ts` verifies token using Firebase Admin SDK
3. Decoded user data attached to `req.user` for downstream use
4. Protected routes require `authMiddleware` before handler

### AI Content Generation

The API uses **Google Gemini AI** with structured prompts and schema validation:

```typescript
// Example: Course generation
const result = await geminiCall(generateCoursePrompt(params), {
  responseSchema: courseSchema, // Zod schema for type safety
  temperature: 0.7,
  maxRetries: 3,
});
```

**Key Features:**

- Schema-constrained responses (no hallucination)
- Automatic retry logic with exponential backoff
- Prompt templates in `utils/prompts/`
- Currently using `gemini-2.5-flash` model

## 🔌 API Endpoints

### Authentication

- `POST /api/signin` - Sign in with email/password
- `POST /api/signup` - Create new user account
- `POST /api/signout` - Sign out user
- `GET /api/profile` - Get current user profile (protected)

### Courses

- `GET /api/my-courses` - List user's courses (protected)
- `GET /api/courses` - List all published courses
- `GET /api/course/:id` - Get course details
- `POST /api/course` - Generate new course with AI (protected)
- `PATCH /api/course/:id` - Update course (protected, owner only)
- `DELETE /api/course/:id` - Delete course (protected, owner only)

### Modules

- `GET /api/:courseId/modules` - List all modules for a course
- `POST /api/modules` - Generate modules for a course with AI (protected)
- `PATCH /api/modules/:id` - Update module (protected)
- `DELETE /api/modules/:id` - Delete module (protected)

### Chapters

- `GET /api/:courseId/chapters` - List all chapters for a course
- `POST /api/chapter` - Generate chapters for a module with AI (protected)
- `PATCH /api/chapter/:id` - Update chapter (protected)
- `DELETE /api/chapter/:id` - Delete chapter (protected)

### Lessons

- `GET /api/:chapterId/lessons` - List all lessons for a chapter
- `POST /api/lesson` - Generate lessons for a chapter with AI (protected)
- `PATCH /api/lesson/:id` - Update lesson (protected)
- `DELETE /api/lesson/:id` - Delete lesson (protected)

## 🛡️ Error Handling

The API uses custom error classes for consistent error responses:

```typescript
// Custom error classes
AppError; // Base error class
UnauthorizedError; // 401 errors
InvalidCredentialsError;
TokenExpiredError;
UserNotFoundError;
ValidationError; // 400 errors with field details
```

All errors are caught by `errorHandler` middleware and returned in this format:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE",
  "fields": {
    "fieldName": "Field-specific error"
  }
}
```

## 📝 Logging

The application uses **Pino** for structured logging:

- Logs are written to `logs/` directory
- Development: Pretty-printed console logs
- Production: JSON-formatted logs
- Request/response logging via middleware
- Error tracking with stack traces

## 🧪 Development

### Code Style

- **Linter**: None currently configured
- **Formatter**: Use your editor's TypeScript formatter
- **Type Checking**: TypeScript strict mode enabled

### Hot Reload

The project uses **nodemon** for automatic server restart on file changes:

```json
// nodemon.json
{
  "watch": ["src"],
  "ext": "ts, html, css, ejs, json",
  "exec": "bun run ./src/server.ts"
}
```

### Debugging

1. Check `logs/` directory for application logs
2. Use `http://localhost:8080/api/docs` to test endpoints
3. Enable verbose logging by setting `NODE_ENV=development`

## 🔒 Security

- **Helmet.js** for security headers
- **CORS** configured for frontend origin
- **Firebase Admin SDK** for secure token verification
- **Input validation** using Zod schemas
- **Environment variable validation** at startup
- **Cookie security** with httpOnly, secure, and sameSite flags

## 🚢 Deployment

### Environment Variables

Ensure all required environment variables are set in your production environment.

### Build & Run

```bash
# Install production dependencies
bun install --production

# Start server
bun run src/server.ts
```

### Health Check

The server logs startup confirmation:

```
Server running on port 8080
```

### Graceful Shutdown

The server handles `SIGTERM` and `SIGINT` signals for graceful shutdown:

- Closes active connections
- Logs shutdown process
- Exits cleanly

## 📚 Dependencies

### Core

- **express** - Web framework
- **firebase-admin** - Firebase Admin SDK
- **@google/genai** - Google Gemini AI SDK
- **zod** - Schema validation

### Middleware

- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **cookie-parser** - Cookie parsing
- **express-validator** - Request validation

### Utilities

- **pino** / **pino-pretty** - Logging
- **dotenv** - Environment variables
- **swagger-jsdoc** / **swagger-ui-express** - API documentation

### Development

- **nodemon** - Auto-reload on file changes
- **typescript** - Type checking
- **tsx** - TypeScript execution

## 📄 License

Private project. All rights reserved.

## 🤝 Contributing

This is a private project. For internal development guidelines, see `.github/copilot-instructions.md`.

## 📞 Support

For issues or questions, contact the development team.
