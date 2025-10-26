import { Firestore } from 'firebase-admin/firestore';
import { firebaseFirestore } from '../../config/firebase';
import { logger } from '../../utils/loggers';
import type { Chapter } from './types';

export class ChapterRepository {
  private firebaseStore: Firestore;
  private readonly COLLECTION_NAME = 'chapters';

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  async getChapters(courseId: string) {
    try {
      const querySnapshot = await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .where('courseId', '==', courseId)
        .orderBy('order', 'asc')
        .get();

      if (querySnapshot.empty) {
        logger.info('No matching chapters found.');
        return [];
      }

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chapter[];
    } catch (error) {
      logger.error('Error in ChapterRepository.getChapter:', error);
      throw error;
    }
  }

  async createChapters(
    courseId: string,
    chapters: Array<
      Omit<Chapter, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>
    >
  ): Promise<Chapter[]> {
    try {
      const batch = this.firebaseStore.batch();
      const createdChapters: Chapter[] = [];

      for (const chapter of chapters) {
        const docRef = this.firebaseStore
          .collection(this.COLLECTION_NAME)
          .doc();
        const data = {
          ...chapter,
          courseId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        batch.set(docRef, data);
        createdChapters.push({
          id: docRef.id,
          ...data,
        } as Chapter);
      }

      await batch.commit();
      logger.info(
        `Created ${createdChapters.length} chapters for course ${courseId}`
      );

      return createdChapters;
    } catch (error) {
      logger.error('Error in ChapterRepository.createChapters:', error);
      throw error;
    }
  }
}
