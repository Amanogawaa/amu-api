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

  googleApiKey: process.env.GEMINI_API_KEY || '',

  // Firebase configuration
  firebase: {
    serviceAccount: {
      type: process.env.FIREBASE_TYPE!,
      project_id: process.env.FIREBASE_PROJECT_ID!,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID!,
      private_key: process.env.FIREBASE_PRIVATE_KEY!,
      client_email: process.env.FIREBASE_CLIENT_EMAIL!,
      client_id: process.env.FIREBASE_CLIENT_ID!,
      auth_uri: process.env.FIREBASE_AUTH_URI!,
      token_uri: process.env.FIREBASE_TOKEN_URI!,
      auth_provider_x509_cert_url:
        process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL!,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_PROVIDER_X509_CERT_URL!,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN!,
    },
  },

  // Authentication configuration
  cookie: process.env.COOKIE_NAME || 'FIREBASE_COOKIE_JWT',
  jwt: {
    secret: process.env.JWT_SECRET!,
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
