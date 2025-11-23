import { AppError, UserNotFoundError } from '../../utils/errors';
import { logger } from '../../utils/loggers';
import type { UserRepository } from './repository';
import type { UpdateUserProfile, UserProfile, UserAnalytics } from './types';
import path from 'path';
import fs from 'fs/promises';

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async getUserProfile(uid: string): Promise<UserProfile> {
    try {
      const profile = await this.userRepository.getUserProfile(uid);

      if (!profile) {
        throw new UserNotFoundError('User profile not found');
      }

      return profile;
    } catch (error) {
      logger.error('Error in UserService.getUserProfile:', error);
      throw error;
    }
  }

  async updateUserProfile(
    uid: string,
    updates: UpdateUserProfile
  ): Promise<UserProfile> {
    try {
      // Validate at least one field is being updated
      if (!updates.firstName && !updates.lastName && !updates.photoURL) {
        throw new AppError(
          'At least one field must be provided for update',
          400
        );
      }

      // Check if user exists
      const existingProfile = await this.userRepository.getUserProfile(uid);
      if (!existingProfile) {
        throw new UserNotFoundError('User profile not found');
      }

      const updatedProfile = await this.userRepository.updateUserProfile(
        uid,
        updates
      );

      logger.info(`User profile updated for uid: ${uid}`);
      return updatedProfile;
    } catch (error) {
      logger.error('Error in UserService.updateUserProfile:', error);
      throw error;
    }
  }

  async uploadProfilePicture(uid: string, file: any): Promise<string> {
    try {
      // Check if user exists
      const existingProfile = await this.userRepository.getUserProfile(uid);
      if (!existingProfile) {
        throw new UserNotFoundError('User profile not found');
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const filename = `${uid}_${Date.now()}${fileExtension}`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'profile-pictures');
      const filePath = path.join(uploadDir, filename);

      // Ensure upload directory exists
      await fs.mkdir(uploadDir, { recursive: true });

      // Save file
      await fs.writeFile(filePath, file.buffer);

      // Delete old profile picture if exists
      if (
        existingProfile.photoURL &&
        existingProfile.photoURL.includes('/uploads/')
      ) {
        const oldFilename = existingProfile.photoURL.split('/').pop();
        if (oldFilename) {
          const oldFilePath = path.join(uploadDir, oldFilename);
          try {
            await fs.unlink(oldFilePath);
          } catch (error) {
            logger.warn(`Failed to delete old profile picture: ${oldFilePath}`);
          }
        }
      }

      // Generate URL
      const photoURL = `/uploads/profile-pictures/${filename}`;

      // Update user profile with new photo URL
      await this.userRepository.updateUserProfile(uid, { photoURL });

      logger.info(`Profile picture uploaded for uid: ${uid}`);
      return photoURL;
    } catch (error) {
      logger.error('Error in UserService.uploadProfilePicture:', error);
      throw error;
    }
  }

  async getUserAnalytics(uid: string): Promise<UserAnalytics> {
    try {
      const analytics = await this.userRepository.getUserAnalytics(uid);
      logger.info(`User analytics retrieved for uid: ${uid}`);
      return analytics;
    } catch (error) {
      logger.error('Error in UserService.getUserAnalytics:', error);
      throw error;
    }
  }
}
