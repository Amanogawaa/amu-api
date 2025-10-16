/**
 * Environment configuration with security-first approach
 * All critical values must be provided via environment variables
 */
import dotenv from 'dotenv';
import { validateAndExit } from './validation';

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

  database_url: process.env.DATABASE_URL!,

  groq_api_key: process.env.GROQ_API_KEY!,

  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL!, // Required, no fallback
    key: process.env.SUPABASE_KEY!, // Required, no fallback
    anonKey: process.env.SUPABASE_ANON_KEY!, // Required for public access
    maxRetries: Number(process.env.SUPABASE_MAX_RETRIES) || 3,
    timeout: Number(process.env.SUPABASE_TIMEOUT) || 10000, // 10 seconds
  },

  // Authentication configuration
  cookie: process.env.COOKIE_NAME || 'SUPABASE_COOKIE_JWT',
  jwt: {
    secret: process.env.JWT_SECRET!, // Required, no fallback
  },

  // Security configuration
  security: {
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:5173', 'http://localhost:3000',
    ],
    maxApiConnections: Number(process.env.MAX_API_CONNECTIONS) || 500,
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
