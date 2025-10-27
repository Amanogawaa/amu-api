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
}
