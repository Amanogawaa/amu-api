import { AppError } from '../../core/utils/errors';
import { type Request, type Response } from 'express';
import { logger } from '../../core/utils/loggers';
import { AuthenticatedRequest } from '../../core/middlewares/auth';
import { AuthService } from './service';
import { SignUpRequest, SignInRequest } from './types';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async signUp(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body as SignUpRequest;

      const result = await this.authService.signUp(userData);

      // Set HTTP-only cookies
      this.setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(201).json({
        data: {
          user: result.user,
          message: 'Account created successfully',
        },
        status: 'success',
      });
    } catch (error) {
      logger.error('Error in AuthController signUp:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        error: (error as Error).message,
        status: 'error',
      });
    }
  }

  async signIn(req: Request, res: Response): Promise<void> {
    try {
      const credentials = req.body as SignInRequest;

      const result = await this.authService.signIn(credentials);

      // Set HTTP-only cookies
      this.setAuthCookies(res, result.accessToken, result.refreshToken);

      res.json({
        data: {
          user: result.user,
          session: result.accessToken,
          message: 'Signed in successfully',
        },
        status: 'success',
      });
    } catch (error) {
      logger.error('Error in AuthController signIn:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        error: (error as Error).message,
        status: 'error',
      });
    }
  }

  async signOut(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const token =
        req.headers.authorization?.replace('Bearer ', '') ||
        req.cookies?.['supabase-auth-token'];

      await this.authService.signOut(token);

      // Clear cookies
      this.clearAuthCookies(res);

      res.json({
        data: { message: 'Signed out successfully' },
        status: 'success',
      });
    } catch (error) {
      logger.error('Error in AuthController signOut:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        error: (error as Error).message,
        status: 'error',
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken =
        req.cookies?.['supabase-refresh-token'] || req.body.refreshToken;

      const result = await this.authService.refreshToken(refreshToken);

      // Update cookies with new tokens
      this.setAuthCookies(res, result.accessToken, result.refreshToken);

      res.json({
        data: {
          user: result.user,
          message: 'Token refreshed successfully',
        },
        status: 'success',
      });
    } catch (error) {
      logger.error('Error in AuthController refreshToken:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        error: (error as Error).message,
        status: 'error',
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await this.authService.getUserProfile(userId);

      res.json({
        data: profile,
        status: 'success',
      });
    } catch (error) {
      logger.error('Error in AuthController getProfile:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        error: (error as Error).message,
        status: 'error',
      });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const updates = req.body;

      const updatedProfile = await this.authService.updateUserProfile(
        userId,
        updates
      );

      res.json({
        data: {
          profile: updatedProfile,
          message: 'Profile updated successfully',
        },
        status: 'success',
      });
    } catch (error) {
      logger.error('Error in AuthController updateProfile:', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        error: (error as Error).message,
        status: 'error',
      });
    }
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
  ): void {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    res.cookie('supabase-auth-token', accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie('supabase-refresh-token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearAuthCookies(res: Response): void {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    res.clearCookie('supabase-auth-token', cookieOptions);
    res.clearCookie('supabase-refresh-token', cookieOptions);
  }
}
