import type { Firestore } from 'firebase-admin/firestore';
import { firebaseFirestore } from '../../config/firebase';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/loggers';
import type { Enrollment, EnrollmentQueryParams } from './types';

export class EnrollmentRepository {
  private firebaseStore: Firestore;
  private readonly COLLECTION_NAME = 'enrollments';

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  async createEnrollment(
    data: Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Enrollment> {
    try {
      const enrollmentId = `${data.courseId}_${data.userId}`;

      const existing = await this.getEnrollmentById(enrollmentId);
      if (existing) {
        if (existing.status === 'dropped') {
          return await this.updateEnrollment(enrollmentId, {
            status: 'active',
            enrolledAt: new Date(),
          });
        }
        throw new AppError('User is already enrolled in this course', 409);
      }

      const enrollmentData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(enrollmentId)
        .set(enrollmentData);

      logger.info(`Enrollment created with ID: ${enrollmentId}`);

      return {
        id: enrollmentId,
        ...enrollmentData,
      };
    } catch (error) {
      logger.error('Error in EnrollmentRepository.createEnrollment:', error);
      throw error;
    }
  }

  async getEnrollmentById(enrollmentId: string): Promise<Enrollment | null> {
    try {
      const doc = await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(enrollmentId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        enrolledAt: data?.enrolledAt?.toDate(),
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
      } as Enrollment;
    } catch (error) {
      logger.error('Error in EnrollmentRepository.getEnrollmentById:', error);
      throw error;
    }
  }

  async getEnrollmentByCourseAndUser(
    courseId: string,
    userId: string
  ): Promise<Enrollment | null> {
    const enrollmentId = `${courseId}_${userId}`;
    return this.getEnrollmentById(enrollmentId);
  }

  async getEnrollmentsByUser(
    userId: string,
    params?: EnrollmentQueryParams
  ): Promise<Enrollment[]> {
    try {
      let query: any = this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .where('userId', '==', userId);

      if (params?.status) {
        query = query.where('status', '==', params.status);
      }

      if (params?.courseId) {
        query = query.where('courseId', '==', params.courseId);
      }

      query = query.orderBy('enrolledAt', 'desc');

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      if (params?.offset) {
        query = query.offset(params.offset);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        return [];
      }

      const enrollments: Enrollment[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        enrollments.push({
          id: doc.id,
          ...data,
          enrolledAt: data.enrolledAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Enrollment);
      });

      return enrollments;
    } catch (error) {
      logger.error(
        'Error in EnrollmentRepository.getEnrollmentsByUser:',
        error
      );
      throw error;
    }
  }

  async getEnrollmentCountByCourse(courseId: string): Promise<number> {
    try {
      const snapshot = await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .where('courseId', '==', courseId)
        .where('status', '==', 'active')
        .count()
        .get();

      return snapshot.data().count;
    } catch (error) {
      logger.error(
        'Error in EnrollmentRepository.getEnrollmentCountByCourse:',
        error
      );
      throw error;
    }
  }

  async updateEnrollment(
    enrollmentId: string,
    updates: Partial<Enrollment>
  ): Promise<Enrollment> {
    try {
      const docRef = this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(enrollmentId);

      const doc = await docRef.get();
      if (!doc.exists) {
        throw new AppError('Enrollment not found', 404);
      }

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await docRef.update(updateData);

      const updatedDoc = await docRef.get();
      const data = updatedDoc.data();

      return {
        id: updatedDoc.id,
        ...data,
        enrolledAt: data?.enrolledAt?.toDate(),
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
      } as Enrollment;
    } catch (error) {
      logger.error('Error in EnrollmentRepository.updateEnrollment:', error);
      throw error;
    }
  }

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    try {
      await this.updateEnrollment(enrollmentId, { status: 'dropped' });
      logger.info(`Enrollment ${enrollmentId} marked as dropped`);
    } catch (error) {
      logger.error('Error in EnrollmentRepository.deleteEnrollment:', error);
      throw error;
    }
  }

  async isUserEnrolled(courseId: string, userId: string): Promise<boolean> {
    try {
      const enrollment = await this.getEnrollmentByCourseAndUser(
        courseId,
        userId
      );
      return enrollment !== null && enrollment.status === 'active';
    } catch (error) {
      logger.error('Error in EnrollmentRepository.isUserEnrolled:', error);
      throw error;
    }
  }
}
