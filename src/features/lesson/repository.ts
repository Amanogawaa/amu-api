import type { Firestore } from 'firebase-admin/firestore';
import { firebaseFirestore } from '../../config/firebase';
import { logger } from '../../utils/loggers';
import type { Lesson } from './types';

export class LessonRepository {
  private firebaseStore: Firestore;
  private readonly COLLECTION_NAME = 'lessons';

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  async getLessons(chapterId: string) {
    try {
      const querySnapshot = await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .where('chapterId', '==', chapterId)
        .orderBy('order', 'asc')
        .get();

      if (querySnapshot.empty) {
        logger.info('No matching chapters found.');
        return [];
      }

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Lesson[];
    } catch (error) {
      logger.error('Error in ChapterRepository.getChapter:', error);
      throw error;
    }
  }

  async createLessons(
    chapterId: string,
    lessons: Array<Omit<Lesson, 'id' | 'chapterId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Lesson[]> {
    try {
      const batch = this.firebaseStore.batch();
      const createdLesson: Lesson[] = [];

      for (const lesson of lessons) {
        const docRef = this.firebaseStore
          .collection(this.COLLECTION_NAME)
          .doc();
        const data = {
          ...lesson,
          chapterId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        batch.set(docRef, data);
        createdLesson.push({
          id: docRef.id,
          ...data,
        } as Lesson);
      }

      await batch.commit();
      logger.info(
        `Created ${createdLesson.length} lesson for chapter ${chapterId}`
      );

      return createdLesson;
    } catch (error) {
      logger.error('Error in LessonRepository.createLessons:', error);
      throw error;
    }
  }

  async updateLessonsBatch(
    lessons: Lesson[]
  ): Promise<{ updated: number; errors: any[] }> {
    const batch = this.firebaseStore.batch();
    const errors: any[] = [];
    let updated = 0;

    try {
      for (const lesson of lessons) {
        if (!lesson.id) {
          errors.push({ lesson, error: 'Lesson ID is required for update' });
          continue;
        }

        const docRef = this.firebaseStore
          .collection(this.COLLECTION_NAME)
          .doc(lesson.id);

        // Check if document exists
        const doc = await docRef.get();
        if (!doc.exists) {
          errors.push({ lesson, error: 'Lesson not found' });
          continue;
        }

        const { id, ...lessonDataWithoutId } = lesson;

        const lessonData = {
          ...lessonDataWithoutId,
          updatedAt: new Date(),
        };

        batch.update(docRef, lessonData);
        updated++;
      }

      await batch.commit();
      return { updated, errors };
    } catch (error) {
      logger.error('Error in LessonRepository.updateLessonsBatch:', error);
      throw error;
    }
  }

  async getLessonById(lessonId: string): Promise<Lesson | null> {
    try {
      const docRef = this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(lessonId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      } as Lesson;
    } catch (error) {
      logger.error('Error in LessonRepository.getLessonById:', error);
      throw error;
    }
  }

  async updateLesson(
    lessonId: string,
    lessonData: Partial<Omit<Lesson, 'id' | 'chapterId' | 'createdAt'>>
  ): Promise<Lesson> {
    try {
      const docRef = this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(lessonId);

      const doc = await docRef.get();
      if (!doc.exists) {
        throw new Error('Lesson not found');
      }

      const updateData = {
        ...lessonData,
        updatedAt: new Date(),
      };

      await docRef.update(updateData);

      const updatedDoc = await docRef.get();
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as Lesson;
    } catch (error) {
      logger.error('Error in LessonRepository.updateLesson:', error);
      throw error;
    }
  }

  async deleteLesson(lessonId: string): Promise<void> {
    try {
      const docRef = this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(lessonId);

      const doc = await docRef.get();
      if (!doc.exists) {
        throw new Error('Lesson not found');
      }

      await docRef.delete();
      logger.info(`Deleted lesson ${lessonId}`);
    } catch (error) {
      logger.error('Error in LessonRepository.deleteLesson:', error);
      throw error;
    }
  }
}
