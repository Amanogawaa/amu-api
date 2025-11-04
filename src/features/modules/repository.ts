import { Firestore } from 'firebase-admin/firestore';
import { firebaseFirestore } from '../../config/firebase';
import { logger } from '../../utils/loggers';
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

  async getModule(moduleId: string) {
    try {
      const docRef = await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(moduleId)
        .get();

      if (!docRef.exists) {
        logger.info('No matching module found.');
        return null;
      }

      return { id: docRef.id, ...docRef.data() } as Module;
    } catch (error) {
      logger.error('Error in ModuleRepository.getModule:', error);
      throw error;
    }
  }

  async createModules(
    courseId: string,
    courseName: string,
    level: 'beginner' | 'intermediate' | 'advanced',
    language: string,
    modules: Array<
      Omit<
        Module,
        | 'id'
        | 'courseId'
        | 'courseName'
        | 'level'
        | 'language'
        | 'createdAt'
        | 'updatedAt'
      >
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
          level,
          language,
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

  async updateModulesBatch(
    modules: Module[]
  ): Promise<{ updated: number; errors: any[] }> {
    const batch = this.firebaseStore.batch();
    const errors: any[] = [];
    let updated = 0;

    try {
      for (const module of modules) {
        if (!module.id) {
          errors.push({ module, error: 'Module ID is required for update' });
          continue;
        }

        const docRef = this.firebaseStore
          .collection(this.COLLECTION_NAME)
          .doc(module.id);

        const doc = await docRef.get();
        if (!doc.exists) {
          errors.push({ module, error: 'Module not found' });
          continue;
        }

        const { id, ...moduleDataWithoutId } = module;

        const moduleData = {
          ...moduleDataWithoutId,
          updatedAt: new Date(),
          learningObjectives: JSON.stringify(module.learningObjectives),
          keySkills: JSON.stringify(module.keySkills),
          prerequisiteModules: JSON.stringify(module.prerequisiteModules),
          capstoneProject: module.capstoneProject
            ? JSON.stringify(module.capstoneProject)
            : null,
        };

        batch.update(docRef, moduleData);
        updated++;
      }

      await batch.commit();
      return { updated, errors };
    } catch (error) {
      throw error;
    }
  }

  async deleteModulesByCourseId(courseId: string): Promise<void> {
    try {
      const querySnapshot = await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .where('courseId', '==', courseId)
        .get();

      const batch = this.firebaseStore.batch();

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      logger.info(`Deleted modules for courseId: ${courseId}`);
    } catch (error) {
      logger.error('Error deleting modules by courseId:', error);
      throw error;
    }
  }
}
