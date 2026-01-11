/* eslint-disable @typescript-eslint/no-explicit-any */
import { Firestore } from "firebase-admin/firestore";
import { firebaseFirestore } from "../../config/firebase";
import { logger } from "../../utils/loggers";
import type { Chapter } from "./types";

export class ChapterRepository {
  private firebaseStore: Firestore;
  private readonly COLLECTION_NAME = "chapters";

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  async getChapters(courseId: string) {
    try {
      const querySnapshot = await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .where("courseId", "==", courseId)
        .get();

      if (querySnapshot.empty) {
        logger.info("No matching chapters found.");
        return [];
      }

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chapter[];
    } catch (error) {
      logger.error("Error in ChapterRepository.getChapter:", error);
      throw error;
    }
  }

  async getChapter(chapterId: string): Promise<Chapter | null> {
    try {
      const docRef = this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(chapterId);
      const doc = await docRef.get();

      if (!doc.exists) {
        logger.info(`Chapter with ID ${chapterId} not found.`);
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      } as Chapter;
    } catch (error) {
      logger.error("Error in ChapterRepository.getChapter:", error);
      throw error;
    }
  }

  async createChapters(
    courseId: string,
    courseName: string,
    chapters: Array<
      Omit<
        Chapter,
        "id" | "courseId" | "courseName" | "createdAt" | "updatedAt"
      >
    >,
  ): Promise<Chapter[]> {
    try {
      const batch = this.firebaseStore.batch();
      const createdChapters: Chapter[] = [];

      for (const chapter of chapters) {
        const docRef = this.firebaseStore
          .collection(this.COLLECTION_NAME)
          .doc();

        const data = {
          courseId,
          courseName,
          ...chapter,
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
        `Created ${createdChapters.length} chapters for course ${courseId}`,
      );

      return createdChapters;
    } catch (error) {
      logger.error("Error in ChapterRepository.createChapters:", error);
      throw error;
    }
  }

  async updateChaptersBatch(
    chapters: Chapter[],
  ): Promise<{ updated: number; errors: any[] }> {
    const batch = this.firebaseStore.batch();
    const errors: any[] = [];
    let updated = 0;

    try {
      for (const chapter of chapters) {
        if (!chapter.id) {
          errors.push({ chapter, error: "Chapter ID is required for update" });
          continue;
        }

        const docRef = this.firebaseStore
          .collection(this.COLLECTION_NAME)
          .doc(chapter.id);

        const doc = await docRef.get();
        if (!doc.exists) {
          errors.push({ chapter, error: "Chapter not found" });
          continue;
        }

        const { id, ...chapterDataWithoutId } = chapter;

        const chapterData = {
          id,
          ...chapterDataWithoutId,
          updatedAt: new Date(),
        };

        batch.update(docRef, chapterData);
        updated++;
      }

      await batch.commit();
      return { updated, errors };
    } catch (error) {
      logger.error("Error in ChapterRepository.updateChaptersBatch:", error);
      throw error;
    }
  }

  async deleteChaptersByCourseId(courseId: string): Promise<void> {
    try {
      const querySnapshot = await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .where("courseId", "==", courseId)
        .get();

      if (querySnapshot.empty) {
        logger.info("No chapters found to delete for courseId:", courseId);
        return;
      }

      const batch = this.firebaseStore.batch();

      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      logger.info(
        `Deleted ${querySnapshot.size} chapters for courseId: ${courseId}`,
      );
    } catch (error) {
      logger.error(
        "Error in ChapterRepository.deleteChaptersByCourseId:",
        error,
      );
      throw error;
    }
  }
}
