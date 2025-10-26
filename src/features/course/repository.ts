import type { Firestore } from 'firebase-admin/firestore';
import { admin, firebaseFirestore } from '../../config/firebase';
import { logger } from '../../utils/loggers';
import type { Course, CourseQueryParams } from './types';
import { AppError } from '../../utils/errors';

export class CourseRepository {
  private firebaseStore: Firestore;
  private readonly COLLECTION_NAME = 'courses';

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  async getCourse(params?: CourseQueryParams): Promise<Course[]> {
    try {
      let query = this.firebaseStore.collection(this.COLLECTION_NAME);

      if (params?.level) {
        query = query.where('level', '==', params.level) as any;
      }
      if (params?.category) {
        query = query.where('category', '==', params.category) as any;
      }
      if (params?.language) {
        query = query.where('language', '==', params.language) as any;
      }
      if (params?.limit) {
        query = query.limit(params.limit) as any;
      }
      if (params?.offset) {
        query = query.offset(params.offset) as any;
      }

      const snapshot = await query.get();

      console.log(query.get());

      if (snapshot.empty) {
        logger.info('No matching courses found.');
        return [];
      }

      const courses: Course[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        courses.push({
          id: doc.id,
          ...data,
          learning_outcomes:
            typeof data.learning_outcomes === 'string'
              ? JSON.parse(data.learning_outcomes)
              : data.learning_outcomes,
        } as Course);
      });

      return courses;
    } catch (error) {
      logger.error('Error in CourseRepository.getCourse:', error);
      throw error;
    }
  }

  async getCourseById(slug: string): Promise<Course> {
    const docRef = this.firebaseStore
      .collection(this.COLLECTION_NAME)
      .doc(slug);
    const doc = await docRef.get();

    if (!doc) {
      logger.info(`No course found with ID: ${slug}`);
      throw new AppError('Course not found', 404);
    }

    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      learning_outcomes:
        typeof data?.learning_outcomes === 'string'
          ? JSON.parse(data.learning_outcomes)
          : data?.learning_outcomes,
      createdAt: data?.createdAt?.toDate,
      updatedAt: data?.updatedAt?.toDate,
    } as Course;
  }

  async createCourse(request: Omit<Course, 'id'>): Promise<Course> {
    try {
      const data = {
        ...request,
        learning_outcomes: Array.isArray(request.learning_outcomes)
          ? JSON.stringify(request.learning_outcomes)
          : request.learning_outcomes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('Data from repository:', data);
      const res = await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .add(data);

      logger.info(`Course created with ID: ${res.id}`);

      if (!res) {
        logger.error('Failed to create course: No response from Firestore');
        throw new Error('Failed to create course');
      }

      const createdCourse: Course = {
        id: res.id,
        ...request,
      };

      return createdCourse;
    } catch (error) {
      logger.error('Error in CourseRepository.createCourse:', error);
      throw error;
    }
  }

  async deleteCourse(slug: string): Promise<void> {
    try {
      const docRef = this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(slug);
      const doc = await docRef.get();

      if (!doc.exists) {
        logger.info(`No course found with ID: ${slug}`);
        throw new AppError('Course not found', 404);
      }

      await docRef.delete();
      logger.info(`Course with ID: ${slug} has been deleted.`);
    } catch (error) {
      logger.error('Error in CourseRepository.deleteCourse:', error);
      throw error;
    }
  }
}
