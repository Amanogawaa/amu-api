import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/loggers';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.headers.authorization?.replace('Bearer', ' ');

    if (!token) {
      token = req.cookies?.['supabase-auth-token'];
    }

    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Invalid or expired token', 401);
    }

    req.user = {
      id: user.id,
      email: user.email!,
      ...user.user_metadata,
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
