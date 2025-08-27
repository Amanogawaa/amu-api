import { AppError } from '../../core/utils/errors';
import { logger } from '../../core/utils/loggers';
import { UserCourseRepository } from './repository';

export class UserCourseService {
  private repository: UserCourseRepository;

  constructor(repository: UserCourseRepository) {
    this.repository = repository;
  }

  async enroll(userId: string, courseId: string): Promise<any> {
    try {
      return await this.repository.enrollUser(userId, courseId);
    } catch (error) {
      logger.error('Error in UserCourseService enroll:', error);
      throw error;
    }
  }

  async markLessonCompleted(
    userId: string,
    lessonId: string,
    score?: number
  ): Promise<void> {
    try {
      await this.repository.markLessonCompleted(userId, lessonId, score);

      const courseId = await this.repository.getCourseIdFromLesson(lessonId);

      const completedCount =
        await this.repository.getCompletedLessonsCountForCourse(
          userId,
          courseId
        );

      const totalCount = await this.repository.getTotalLessonsCountForCourse(
        courseId
      );

      const progress =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      const completedAt =
        progress === 100 ? new Date().toISOString() : undefined;

      await this.repository.updateCourseProgress(
        userId,
        courseId,
        progress,
        completedAt
      );
    } catch (error) {
      logger.error('Error in UserCourseService markLessonCompleted:', error);
      throw error;
    }
  }

  async getProgress(userId: string, courseId: string): Promise<any> {
    try {
      return await this.repository.getUserCourseProgress(userId, courseId);
    } catch (error) {
      logger.error('Error in UserCourseService getProgress:', error);
      throw error;
    }
  }
}
