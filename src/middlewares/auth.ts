/**
 * Authentication middleware for Firebase
 * Verifies Firebase ID tokens from Authorization header or cookie
 */

import type { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { AppError } from '../utils/errors';
import { logger } from '../utils/loggers';
import { config } from '../config/environment';

// Interface for authenticated request with user data
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string | undefined;
    [key: string]: any;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header or cookie
    let token = req.headers.authorization?.replace('Bearer ', '').trim();

    if (!token) {
      token = req.cookies?.[config.cookie || 'FIREBASE_COOKIE_JWT'];
    }

    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }

    // Verify Firebase ID token using Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user data to request
    const { uid, email, ...claims } = decodedToken;
    req.user = {
      uid,
      email,
      ...claims, // Include additional claims (e.g., custom claims)
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    const status = error instanceof AppError ? error.statusCode : 401;
    res.status(status).json({
      error: (error as Error).message,
      status: 'error',
    });
  }
};