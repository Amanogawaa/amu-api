import { firebaseFirestore } from '../../config/firebase';
import { AppError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/loggers';
import type { AuthRepository } from './repository';
import type { CreateUser, LoginUser } from './types';

export class AuthService {
  private authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  public async signUp(userData: CreateUser) {
    try {
      const userExists = await this.isExistingUser(userData.email);

      if (userExists) {
        logger.warn(
          `Attempt to sign up with existing email: ${userData.email}`
        );
        throw new ConflictError('User with this email already exists');
      }

      this.validateSignUpData(userData);
      await this.authRepository.createUser(userData);

      logger.info(`Use  r signed up with email: ${userData.email}`);

      return { message: 'User created successfully' };
    } catch (error) {
      logger.error('Error in AuthService.signUp:', error);
      throw error;
    }
  }

  private validateSignUpData(userData: CreateUser): void {
    if (!userData.email || !userData.password) {
      throw new AppError('Email and password are required', 400);
    }

    if (userData.password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }
  }

  private isExistingUser(email: string): Promise<boolean> {
    return firebaseFirestore
      .collection('users')
      .where('email', '==', email)
      .get()
      .then((snapshot) => !snapshot.empty);
  }
}
