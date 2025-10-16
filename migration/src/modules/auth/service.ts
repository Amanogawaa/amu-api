import { logger } from '../../core/utils/loggers';
import { AppError } from '../../core/utils/errors';
import { AuthRepository } from './repository';
import { AuthResponse, SignInRequest, SignUpRequest } from './types';

export class AuthService {
  private authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    try {
      // Business logic validation
      this.validateSignUpData(userData);

      // Check if user already exists (optional business rule)
      // You could add additional checks here

      return await this.authRepository.signUp(userData);
    } catch (error) {
      logger.error('Error in AuthService signUp:', error);
      throw error;
    }
  }

  async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    try {
      // Business logic validation
      this.validateSignInData(credentials);

      return await this.authRepository.signIn(credentials);
    } catch (error) {
      logger.error('Error in AuthService signIn:', error);
      throw error;
    }
  }

  async signOut(accessToken: string): Promise<void> {
    try {
      if (!accessToken) {
        throw new AppError('Access token is required for sign out', 400);
      }

      await this.authRepository.signOut(accessToken);
    } catch (error) {
      logger.error('Error in AuthService signOut:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      return await this.authRepository.refreshToken(refreshToken);
    } catch (error) {
      logger.error('Error in AuthService refreshToken:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    try {
      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      return await this.authRepository.getUserById(userId);
    } catch (error) {
      logger.error('Error in AuthService getUserProfile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: any): Promise<any> {
    try {
      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      // Business logic for profile updates
      this.validateProfileUpdates(updates);

      return await this.authRepository.updateUserProfile(userId, updates);
    } catch (error) {
      logger.error('Error in AuthService updateUserProfile:', error);
      throw error;
    }
  }

  // Private validation methods
  private validateSignUpData(userData: SignUpRequest): void {
    if (!userData.email || !userData.password) {
      throw new AppError('Email and password are required', 400);
    }

    if (userData.password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new AppError('Invalid email format', 400);
    }
  }

  private validateSignInData(credentials: SignInRequest): void {
    if (!credentials.email || !credentials.password) {
      throw new AppError('Email and password are required', 400);
    }
  }

  private validateProfileUpdates(updates: any): void {
    // Add validation rules for profile updates
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        throw new AppError('Invalid email format', 400);
      }
    }

    // Add more validation rules as needed
  }
}
