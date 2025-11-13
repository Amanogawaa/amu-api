import { AppError } from '../../utils/errors';
import { logger } from '../../utils/loggers';
import type { CourseRepository } from '../course/repository';
import type { ProgressRepository } from '../progress/repository';
import type { EnrollmentRepository } from './repository';
import type { Enrollment, EnrollmentQueryParams } from './types';

export class EnrollmentService {
  constructor(
    private enrollmentRepository: EnrollmentRepository,
    private courseRepository: CourseRepository,
    private progressRepository: ProgressRepository
  ) {}

  /**
   * Enroll a user in a course
   */
  async enrollInCourse(courseId: string, userId: string): Promise<Enrollment> {
    try {
      // 1. Get the course
      const course = await this.courseRepository.getCourseById(courseId);

      // 2. Validate enrollment rules
      if (!course.publish) {
        throw new AppError('Cannot enroll in unpublished courses', 403);
      }

      if (course.archive) {
        throw new AppError('Cannot enroll in archived courses', 403);
      }

      if (course.uid === userId) {
        throw new AppError('Cannot enroll in your own course', 400);
      }

      // 3. Create enrollment
      const enrollment = await this.enrollmentRepository.createEnrollment({
        courseId,
        userId,
        enrolledAt: new Date(),
        status: 'active',
      });

      // 4. Create initial progress record
      await this.progressRepository.createProgress({
        courseId,
        userId,
        lessonsCompleted: [],
        totalLessons: 0, // Will be updated when user starts lessons
        percentComplete: 0,
        lastActivityAt: new Date(),
        enrolledAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info(`User ${userId} successfully enrolled in course ${courseId}`);

      return enrollment;
    } catch (error) {
      logger.error('Error in EnrollmentService.enrollInCourse:', error);
      throw error;
    }
  }

  /**
   * Unenroll a user from a course
   */
  async unenrollFromCourse(courseId: string, userId: string): Promise<void> {
    try {
      const enrollmentId = `${courseId}_${userId}`;
      const enrollment = await this.enrollmentRepository.getEnrollmentById(
        enrollmentId
      );

      if (!enrollment) {
        throw new AppError('Enrollment not found', 404);
      }

      if (enrollment.status !== 'active') {
        throw new AppError('Enrollment is not active', 400);
      }

      // Soft delete - mark as dropped
      await this.enrollmentRepository.deleteEnrollment(enrollmentId);

      logger.info(`User ${userId} unenrolled from course ${courseId}`);
    } catch (error) {
      logger.error('Error in EnrollmentService.unenrollFromCourse:', error);
      throw error;
    }
  }

  /**
   * Get enrollment status for a course
   */
  async getEnrollmentStatus(
    courseId: string,
    userId: string
  ): Promise<{ isEnrolled: boolean; enrollment?: Enrollment }> {
    try {
      const enrollment =
        await this.enrollmentRepository.getEnrollmentByCourseAndUser(
          courseId,
          userId
        );

      if (!enrollment || enrollment.status !== 'active') {
        return { isEnrolled: false };
      }

      return { isEnrolled: true, enrollment };
    } catch (error) {
      logger.error('Error in EnrollmentService.getEnrollmentStatus:', error);
      throw error;
    }
  }

  /**
   * Get all enrollments for a user
   */
  async getUserEnrollments(
    userId: string,
    params?: EnrollmentQueryParams
  ): Promise<Enrollment[]> {
    try {
      return await this.enrollmentRepository.getEnrollmentsByUser(
        userId,
        params
      );
    } catch (error) {
      logger.error('Error in EnrollmentService.getUserEnrollments:', error);
      throw error;
    }
  }

  /**
   * Get enrollment count for a course
   */
  async getCourseEnrollmentCount(courseId: string): Promise<number> {
    try {
      return await this.enrollmentRepository.getEnrollmentCountByCourse(
        courseId
      );
    } catch (error) {
      logger.error(
        'Error in EnrollmentService.getCourseEnrollmentCount:',
        error
      );
      throw error;
    }
  }

  /**
   * Check if user is enrolled in a course
   */
  async isUserEnrolled(courseId: string, userId: string): Promise<boolean> {
    try {
      return await this.enrollmentRepository.isUserEnrolled(courseId, userId);
    } catch (error) {
      logger.error('Error in EnrollmentService.isUserEnrolled:', error);
      throw error;
    }
  }

  /**
   * Mark enrollment as completed
   */
  async markEnrollmentAsCompleted(
    courseId: string,
    userId: string
  ): Promise<Enrollment> {
    try {
      const enrollmentId = `${courseId}_${userId}`;
      return await this.enrollmentRepository.updateEnrollment(enrollmentId, {
        status: 'completed',
      });
    } catch (error) {
      logger.error(
        'Error in EnrollmentService.markEnrollmentAsCompleted:',
        error
      );
      throw error;
    }
  }
}
