/**
 * Environment variable validation and startup checks
 * Ensures all required configuration is present before application starts
 */

interface ValidationError {
  variable: string;
  message: string;
}

/**
 * Validates required environment variables
 * @returns Array of validation errors, empty if all valid
 */
export function validateEnvironment(): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required environment variables
  const requiredVars = [
    { name: 'NODE_ENV', value: process.env.NODE_ENV },
    { name: 'JWT_SECRET', value: process.env.JWT_SECRET },
    { name: 'FIREBASE_TYPE', value: process.env.FIREBASE_TYPE },
    { name: 'FIREBASE_PROJECT_ID', value: process.env.FIREBASE_PROJECT_ID },
    { name: 'FIREBASE_PRIVATE_KEY_ID', value: process.env.FIREBASE_PRIVATE_KEY_ID },
    { name: 'FIREBASE_PRIVATE_KEY', value: process.env.FIREBASE_PRIVATE_KEY },
    { name: 'FIREBASE_CLIENT_EMAIL', value: process.env.FIREBASE_CLIENT_EMAIL },
    { name: 'FIREBASE_CLIENT_ID', value: process.env.FIREBASE_CLIENT_ID },
    { name: 'FIREBASE_AUTH_URI', value: process.env.FIREBASE_AUTH_URI },
    { name: 'FIREBASE_TOKEN_URI', value: process.env.FIREBASE_TOKEN_URI },
    { name: 'FIREBASE_AUTH_PROVIDER_X509_CERT_URL', value: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL },
    { name: 'FIREBASE_CLIENT_PROVIDER_X509_CERT_URL', value: process.env.FIREBASE_CLIENT_PROVIDER_X509_CERT_URL },
    { name: 'FIREBASE_UNIVERSE_DOMAIN', value: process.env.FIREBASE_UNIVERSE_DOMAIN },
  ];

  // Check for missing or empty variables
  for (const { name, value } of requiredVars) {
    if (!value || value.trim() === '') {
      errors.push({
        variable: name,
        message: `${name} is required but not set or empty`,
      });
    }
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push({
      variable: 'JWT_SECRET',
      message: 'JWT_SECRET must be at least 32 characters long for security',
    });
  }

  // Validate Firebase-specific fields
  if (process.env.FIREBASE_TYPE && process.env.FIREBASE_TYPE !== 'service_account') {
    errors.push({
      variable: 'FIREBASE_TYPE',
      message: "FIREBASE_TYPE must be 'service_account'",
    });
  }

  if (process.env.FIREBASE_PRIVATE_KEY && !process.env.FIREBASE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----')) {
    errors.push({
      variable: 'FIREBASE_PRIVATE_KEY',
      message: 'FIREBASE_PRIVATE_KEY is invalid (must include -----BEGIN PRIVATE KEY-----)',
    });
  }

  if (process.env.FIREBASE_AUTH_URI && !process.env.FIREBASE_AUTH_URI.startsWith('https://')) {
    errors.push({
      variable: 'FIREBASE_AUTH_URI',
      message: 'FIREBASE_AUTH_URI must be a valid HTTPS URL',
    });
  }

  if (process.env.FIREBASE_TOKEN_URI && !process.env.FIREBASE_TOKEN_URI.startsWith('https://')) {
    errors.push({
      variable: 'FIREBASE_TOKEN_URI',
      message: 'FIREBASE_TOKEN_URI must be a valid HTTPS URL',
    });
  }

  if (
    process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL &&
    !process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL.startsWith('https://')
  ) {
    errors.push({
      variable: 'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
      message: 'FIREBASE_AUTH_PROVIDER_X509_CERT_URL must be a valid HTTPS URL',
    });
  }

  if (
    process.env.FIREBASE_CLIENT_X509_CERT_URL &&
    !process.env.FIREBASE_CLIENT_X509_CERT_URL.startsWith('https://')
  ) {
    errors.push({
      variable: 'FIREBASE_CLIENT_X509_CERT_URL',
      message: 'FIREBASE_CLIENT_X509_CERT_URL must be a valid HTTPS URL',
    });
  }

  if (
    process.env.FIREBASE_UNIVERSE_DOMAIN &&
    process.env.FIREBASE_UNIVERSE_DOMAIN !== 'googleapis.com'
  ) {
    errors.push({
      variable: 'FIREBASE_UNIVERSE_DOMAIN',
      message: "FIREBASE_UNIVERSE_DOMAIN must be 'googleapis.com'",
    });
  }

  // Validate port
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push({
      variable: 'PORT',
      message: 'PORT must be a valid port number (1-65535)',
    });
  }

  return errors;
}

/**
 * Validates environment and exits process if critical errors found
 * Should be called before any other initialization
 */
export function validateAndExit(): void {
  const errors = validateEnvironment();

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach((error) => {
      console.error(`- ${error.variable}: ${error.message}`);
    });

    console.error(
      'Application cannot start with invalid configuration. Please fix the above errors.'
    );
    process.exit(1);
  }

  console.info('Environment validation passed');
}

/**
 * Generates a secure random JWT secret for development
 * @returns Random 64-character hex string
 */
export function generateSecureJWTSecret(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}