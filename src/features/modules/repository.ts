import { Firestore } from 'firebase-admin/firestore';
import { firebaseFirestore } from '../../config/firebase';
import { logger } from '../../utils/loggers';
import type { Chapter } from '../chapter/types';
import type { Module } from './types';

export class ModuleRepository {
  private firebaseStore: Firestore;
  private readonly COLLECTION_NAME = 'modules';

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  async getModules(courseId: string) {
    try {
      const querySnapshot = await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .where('courseId', '==', courseId)
        .get();

      if (querySnapshot.empty) {
        logger.info('No matching modules found.');
        return [];
      }

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Module[];
    } catch (error) {
      logger.error('Error in ChapterRepository.getChapter:', error);
      throw error;
    }
  }

  async createModules(
    courseId: string,
    courseName: string,
    modules: Array<
      Omit<Module, 'id' | 'courseId' | 'courseName' | 'createdAt' | 'updatedAt'>
    >
  ): Promise<Module[]> {
    const batch = this.firebaseStore.batch();
    const createdModules: Module[] = [];

    try {
      for (const module of modules) {
        const docRef = this.firebaseStore
          .collection(this.COLLECTION_NAME)
          .doc();

        const data = {
          ...module,
          courseId,
          courseName,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        batch.set(docRef, data);
        createdModules.push({ id: docRef.id, ...data } as Module);
      }

      await batch.commit();

      return createdModules;
    } catch (error) {
      logger.error('Error creating modules:', error);
      throw error;
    }
  }
}
