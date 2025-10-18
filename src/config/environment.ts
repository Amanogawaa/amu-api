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

  // Firebase configuration
  firebase: {
    serviceAccount: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!), 
  },

  // Authentication configuration
  cookie: process.env.COOKIE_NAME || 'FIREBASE_COOKIE_JWT',
  jwt: {
    secret: process.env.JWT_SECRET!, // Required, no fallback
  },

  // Security configuration
  security: {
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    maxApiConnections: Number(process.env.MAX_API_CONNECTIONS) || 500,
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};