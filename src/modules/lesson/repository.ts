/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import NodeCache from "node-cache";
import { firebaseFirestore } from "../../config/firebase";
import { logger } from "../../core/utils/loggers";
import type { Lesson } from "./types";

export class LessonRepository {
  private firebaseStore: Firestore;
  private readonly COLLECTION_NAME = "lessons";
  private readonly DEFAULT_LIMIT = 100;
  private cache: NodeCache;

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
    this.cache = new NodeCache({
      stdTTL: 600,
      checkperiod: 120,
      useClones: false,
    });
  }

  async getLessons(chapterId: string, fields?: string[]) {
    try {
      logger.info(`Fetching lessons for chapter: ${chapterId}`);

      const cacheKey = `lessons:chapter:${chapterId}`;
      const cached = this.cache.get<Lesson[]>(cacheKey);

      if (cached) {
        logger.info(`Cache hit for lessons in chapter: ${chapterId}`);
        return cached;
      }

      let query: any = this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .where("chapterId", "==", chapterId)
        .limit(this.DEFAULT_LIMIT);

      if (fields && fields.length > 0) {
        query = query.select(...fields);
      } else {
        query = query.select(
          "lessonName",
          "lessonDescription",
          "lessonOrder",
          "type",
          "duration",
          "chapterId",
          "courseId",
          "videoUrl",
          "content",
          "videoTranscript",
          "learningOutcome",
          "quizId",
        );
      }

      const querySnapshot = await query.get();

      logger.info(
        `Found ${querySnapshot.size} lessons for chapter: ${chapterId}`,
      );

      if (querySnapshot.empty) {
        logger.info(`No matching lessons found for chapter: ${chapterId}`);
        return [];
      }

      const lessons = querySnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Lesson[];

      const sortedLessons = lessons.sort(
        (a, b) => a.lessonOrder - b.lessonOrder,
      );

      this.cache.set(cacheKey, sortedLessons);

      return sortedLessons;
    } catch (error) {
      logger.error("Error in LessonRepository.getLessons:", error);
      throw error;
    }
  }

  async createLessons(
    chapterId: string,
    lessons: Array<
      Omit<Lesson, "id" | "chapterId" | "createdAt" | "updatedAt">
    >,
    courseId?: string,
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
          ...(courseId && { courseId }), 
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
        `Created ${createdLesson.length} lessons for chapter ${chapterId}`,
      );

      this.cache.del(`lessons:chapter:${chapterId}`);

      return createdLesson;
    } catch (error) {
      logger.error("Error in LessonRepository.createLessons:", error);
      throw error;
    }
  }

  async updateLessonsBatch(
    lessons: Lesson[],
  ): Promise<{ updated: number; errors: any[] }> {
    const batch = this.firebaseStore.batch();
    const errors: any[] = [];
    let updated = 0;

    try {
      for (const lesson of lessons) {
        if (!lesson.id) {
          errors.push({ lesson, error: "Lesson ID is required for update" });
          continue;
        }

        const docRef = this.firebaseStore
          .collection(this.COLLECTION_NAME)
          .doc(lesson.id);

        const doc = await docRef.get();
        if (!doc.exists) {
          errors.push({ lesson, error: "Lesson not found" });
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
      logger.error("Error in LessonRepository.updateLessonsBatch:", error);
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
      logger.error("Error in LessonRepository.getLessonById:", error);
      throw error;
    }
  }

  async updateLesson(
    lessonId: string,
    lessonData: Partial<Omit<Lesson, "id" | "chapterId" | "createdAt">>,
  ): Promise<Lesson> {
    try {
      const docRef = this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(lessonId);

      const doc = await docRef.get();
      if (!doc.exists) {
        throw new Error("Lesson not found");
      }

      const updateData = {
        ...lessonData,
        updatedAt: new Date(),
      };

      await docRef.update(updateData);

      const updatedDoc = await docRef.get();
      const lesson = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as Lesson;

      const chapterId = (updatedDoc.data() as any)?.chapterId;
      if (chapterId) {
        this.cache.del(`lessons:chapter:${chapterId}`);
      }

      return lesson;
    } catch (error) {
      logger.error("Error in LessonRepository.updateLesson:", error);
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
        throw new Error("Lesson not found");
      }

      const chapterId = (doc.data() as any)?.chapterId;

      await docRef.delete();

      if (chapterId) {
        this.cache.del(`lessons:chapter:${chapterId}`);
      }

      logger.info(`Deleted lesson ${lessonId}`);
    } catch (error) {
      logger.error("Error in LessonRepository.deleteLesson:", error);
      throw error;
    }
  }

  async getLesson(lessonId: string): Promise<any | null> {
    return this.getLessonById(lessonId);
  }

  async getChapterForLesson(chapterId: string): Promise<any | null> {
    try {
      const docRef = this.firebaseStore.collection("chapters").doc(chapterId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      logger.error("Error fetching chapter for lesson:", error);
      throw error;
    }
  }

  async getCourseForLesson(chapterId: string): Promise<any | null> {
    try {
      const chapter = await this.getChapterForLesson(chapterId);
      if (!chapter) {
        return null;
      }

      const docRef = this.firebaseStore
        .collection("courses")
        .doc(chapter.courseId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      logger.error("Error fetching course for lesson:", error);
      throw error;
    }
  }
}
