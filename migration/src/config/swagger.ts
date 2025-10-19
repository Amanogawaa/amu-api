import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Amu server API",
      version: "1.0.0",
      description: "api documentation",
    },
    servers: [{ url: "/api/amu" }],
    security: [
      {
        bearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token from signin/signup response",
        },
      },
      schemas: {
        GenerateLessonsRequest: {
          type: "object",
          required: ["chapterId", "chapterTitle", "courseName"],
          properties: {
            chapterId: { type: "string" },
            chapterTitle: { type: "string" },
            chapterDescription: { type: "string" },
            chapterOrder: { type: "integer" },
            estimatedDuration: { type: "string" },
            courseName: { type: "string" },
            level: {
              type: "string",
              enum: ["beginner", "intermediate", "advanced"],
            },
            language: { type: "string" },
          },
        },
        GenerateCourseRequest: {
          type: "object",
          required: [
            "category",
            "topic",
            "level",
            "duration",
            "noOfChapters",
            "language",
          ],
          properties: {
            category: { type: "string", default: "programming" },
            topic: { type: "string", default: "javascript" },
            level: {
              type: "string",
              enum: ["beginner", "intermediate", "advanced"],
              default: "beginner",
            },
            duration: { type: "string", default: "6 hours" },
            noOfChapters: { type: "integer", default: 6 },
            language: { type: "string", default: "en" },
          },
        },
        Course: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            subtitle: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            topic: { type: "string" },
            level: { type: "string" },
            language: { type: "string" },
            prerequisites: { type: "string" },
            learning_outcomes: { type: "array", items: { type: "string" } },
            duration: { type: "string" },
            no_of_chapters: { type: "integer" },
            publish: { type: "boolean" },
            include_certificate: { type: "boolean" },
            banner_url: { type: "string" },
            last_updated: { type: "string" },
          },
        },
        GenerateChaptersRequest: {
          type: "object",
          required: [
            "courseId",
            "title",
            "description",
            "learningOutcomes",
            "duration",
            "noOfChapters",
            "level",
            "language",
          ],
          properties: {
            courseId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            learningOutcomes: { type: "array", items: { type: "string" } },
            duration: { type: "string" },
            noOfChapters: { type: "integer" },
            level: {
              type: "string",
              enum: ["beginner", "intermediate", "advanced"],
            },
            language: { type: "string" },
          },
        },
        Chapter: {
          type: "object",
          properties: {
            id: { type: "string" },
            courseId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            estimatedDuration: { type: "string" },
            order: { type: "integer" },
          },
        },

        SignUpRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            firstName: { type: "string" },
            lastName: { type: "string" },
          },
        },

        SignInRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },

        AuthResponse: {
          type: "object",
          properties: {
            user: { type: "object" },
            session: { type: "object" },
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },

        UserProfile: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            first_name: { type: "string" },
            last_name: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },

        ProfileUpdateRequest: {
          type: "object",
          properties: {
            first_name: { type: "string" },
            last_name: { type: "string" },
            email: { type: "string", format: "email" },
          },
        },

        RefreshTokenRequest: {
          type: "object",
          properties: {
            refreshToken: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["src/modules/**/*.ts", "src/routes.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
