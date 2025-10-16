import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../core/utils/loggers';
import { AppError } from '../../core/utils/errors';
import { SignInRequest, SignUpRequest, AuthResponse } from './types';

export class AuthRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
          },
        },
      });

      if (error) {
        logger.error('Repository: Sign up error:', error);
        throw new AppError(`Sign up failed: ${error.message}`, 400);
      }

      if (!data.user || !data.session) {
        throw new AppError(
          'Sign up succeeded but no user/session returned',
          500
        );
      }

      return {
        user: data.user,
        session: data.session,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      logger.error('Error in AuthRepository signUp:', error);
      throw error;
    }
  }

  async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        logger.error('Repository: Sign in error:', error);
        throw new AppError(`Sign in failed: ${error.message}`, 401);
      }

      if (!data.user || !data.session) {
        throw new AppError('Invalid credentials', 401);
      }

      return {
        user: data.user,
        session: data.session,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      logger.error('Error in AuthRepository signIn:', error);
      throw error;
    }
  }

  async signOut(accessToken: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.admin.signOut(accessToken);

      if (error) {
        logger.error('Repository: Sign out error:', error);
        throw new AppError(`Sign out failed: ${error.message}`, 400);
      }
    } catch (error) {
      logger.error('Error in AuthRepository signOut:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        logger.error('Repository: Token refresh error:', error);
        throw new AppError('Token refresh failed', 401);
      }

      return {
        user: data.user,
        session: data.session,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      logger.error('Error in AuthRepository refreshToken:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('profiles') // Assuming you have a profiles table
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Repository: Get user profile error:', error);
        throw new AppError(`Failed to get user profile: ${error.message}`, 404);
      }

      return data;
    } catch (error) {
      logger.error('Error in AuthRepository getUserById:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: any): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Repository: Update user profile error:', error);
        throw new AppError(
          `Failed to update user profile: ${error.message}`,
          400
        );
      }

      return data;
    } catch (error) {
      logger.error('Error in AuthRepository updateUserProfile:', error);
      throw error;
    }
  }
}
