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

  async enrollInCourse(courseId: string, userId: string): Promise<Enrollment> {
    try {
      const course = await this.courseRepository.getCourseById(courseId);

      if (!course.publish) {
        throw new AppError('Cannot enroll in unpublished courses', 403);
      }

      if (course.archive) {
        throw new AppError('Cannot enroll in archived courses', 403);
      }

      if (course.uid === userId) {
        throw new AppError('Cannot enroll in your own course', 400);
      }

      const enrollment = await this.enrollmentRepository.createEnrollment({
        courseId,
        userId,
        enrolledAt: new Date(),
        status: 'active',
      });

      await this.progressRepository.createProgress({
        courseId,
        userId,
        lessonsCompleted: [],
        totalLessons: 0,
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

      await this.enrollmentRepository.deleteEnrollment(enrollmentId);

      logger.info(`User ${userId} unenrolled from course ${courseId}`);
    } catch (error) {
      logger.error('Error in EnrollmentService.unenrollFromCourse:', error);
      throw error;
    }
  }

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

  async getUserEnrollments(
    userId: string,
    params?: EnrollmentQueryParams
  ): Promise<Enrollment[]> {
    try {
      const enrollments = await this.enrollmentRepository.getEnrollmentsByUser(
        userId,
        params
      );

      const enrollmentsWithCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            const course = await this.courseRepository.getCourseById(
              enrollment.courseId
            );
            return {
              ...enrollment,
              course,
            };
          } catch (error) {
            logger.warn(
              `Failed to fetch course ${enrollment.courseId} for enrollment ${enrollment.id}`,
              error
            );
            return enrollment;
          }
        })
      );

      // Get user's own published courses
      const ownedPublishedCourses = await this.courseRepository.getCourse({
        uid: userId,
        publish: true,
      });

      // Create pseudo-enrollments for owned published courses
      const ownedCourseEnrollments = ownedPublishedCourses.map(
        (course: any) => ({
          id: `${course.id}_${userId}_owner`,
          courseId: course.id,
          userId,
          enrolledAt: course.createdAt || new Date(),
          status: 'active' as const,
          course,
        })
      );

      // Combine both lists, avoiding duplicates
      const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
      const uniqueOwnedCourses = ownedCourseEnrollments.filter(
        (oe: any) => !enrolledCourseIds.has(oe.courseId)
      );

      return [...enrollmentsWithCourses, ...uniqueOwnedCourses] as any;
    } catch (error) {
      logger.error('Error in EnrollmentService.getUserEnrollments:', error);
      throw error;
    }
  }

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

  async isUserEnrolled(courseId: string, userId: string): Promise<boolean> {
    try {
      return await this.enrollmentRepository.isUserEnrolled(courseId, userId);
    } catch (error) {
      logger.error('Error in EnrollmentService.isUserEnrolled:', error);
      throw error;
    }
  }

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
