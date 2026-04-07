/**
 * Environment configuration with security-first approach
 * All critical values must be provided via environment variables
 */
import dotenv from "dotenv";
import { validateAndExit } from "./validation";

// Load environment variables from .env file
dotenv.config();

// Validate environment before creating config
validateAndExit();

/**
 * Application configuration object with validated environment variables
 * All critical values are required and validated at startup
 */
export const config = {
  // Application environment settings
  env: process.env.NODE_ENV!,
  port: Number(process.env.PORT) || 3000,

  googleApiKey: process.env.GEMINI_API_KEY || "",

  // Authentication configuration
  cookie: process.env.COOKIE_NAME || "COURSECRAFT_COOKIE",
  jwt: {
    secret: process.env.JWT_SECRET!,
  },

  convex: {
    url: process.env.CONVEX_URL || "",
    site_url: process.env.CONVEX_SITE_URL || "",
  },

  // Security configuration
  security: {
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    rateLimitAuthMax: Number(process.env.RATE_LIMIT_AUTH_MAX) || 5,
    corsOrigins: process.env.CORS_ORIGINS?.split(",").map((origin) =>
      origin.trim(),
    ) || ["http://localhost:5173", "http://localhost:3000"],
    maxApiConnections: Number(process.env.MAX_API_CONNECTIONS) || 500,
    cookieSecret: process.env.COOKIE_SECRET || crypto.randomUUID(),
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};
