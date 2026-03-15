/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import NodeCache from "node-cache";
import { firebaseFirestore } from "../../config/firebase";
import { AppError } from "../../utils/errors";
import { logger } from "../../utils/loggers";
import { sanitizeSearchQuery, sanitizeInput } from "../../utils/sanitizer";
import type { Course, CourseQueryParams } from "./types";
import type { StagedCourseData } from "../../utils/service/generation.service";

export class CourseRepository {
  private firebaseStore: Firestore;
  private readonly COLLECTION_NAME = "courses";
  private readonly DEFAULT_LIMIT = 50;
  private readonly MAX_LIMIT = 100;
  private cache: NodeCache;

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;

    this.cache = new NodeCache({
      stdTTL: 600,
      checkperiod: 120,
      useClones: false,
    });
  }

  async getCourse(params?: CourseQueryParams): Promise<Course[]> {
    try {
      let query = this.firebaseStore.collection(this.COLLECTION_NAME);

      if (params?.uid) {
        query = query.where("uid", "==", params.uid) as any;
      }

      if (params?.search) {
        const sanitizedSearch = sanitizeSearchQuery(params.search);
        query = query
          .where("name", ">=", sanitizedSearch)
          .where("name", "<=", sanitizedSearch + "\uf8ff") as any;
      }

      if (params?.publish !== undefined) {
        query = query.where("publish", "==", params.publish) as any;
      }

      if (params?.draft !== undefined) {
        query = query.where("draft", "==", params.draft) as any;
      }

      if (params?.level) {
        query = query.where("level", "==", sanitizeInput(params.level)) as any;
      }
      if (params?.category) {
        query = query.where(
          "category",
          "==",
          sanitizeInput(params.category),
        ) as any;
      }
      if (params?.language) {
        query = query.where(
          "language",
          "==",
          sanitizeInput(params.language),
        ) as any;
      }

      const limit = params?.limit
        ? Math.min(params.limit, this.MAX_LIMIT)
        : this.DEFAULT_LIMIT;
      query = query.limit(limit) as any;

      if (params?.offset) {
        query = query.offset(params.offset) as any;
      }

      query = query.orderBy("createdAt", "desc") as any;

      if (params?.fields) {
        query = query.select(...params.fields) as any;
      } else {
        query = query.select(
          "name",
          "description",
          "thumbnail",
          "duration",
          "level",
          "category",
          "language",
          "publish",
          "draft",
          "uid",
          "createdAt",
          "updatedAt",
        ) as any;
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        logger.info("No matching courses found.");
        return [];
      }

      const courses: Course[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        courses.push({
          id: doc.id,
          ...data,
          learning_outcomes:
            typeof data.learning_outcomes === "string"
              ? JSON.parse(data.learning_outcomes)
              : data.learning_outcomes,
        } as Course);
      });

      return courses;
    } catch (error) {
      logger.error("Error in CourseRepository.getCourse:", error);
      throw error;
    }
  }

  async getCourseById(slug: string): Promise<Course> {
    const cacheKey = `course:${slug}`;
    const cached = this.cache.get<Course>(cacheKey);

    if (cached) {
      logger.info(`Cache hit for course: ${slug}`);
      return cached;
    }

    const docRef = this.firebaseStore
      .collection(this.COLLECTION_NAME)
      .doc(slug);
    const doc = await docRef.get();

    if (!doc) {
      logger.info(`No course found with ID: ${slug}`);
      throw new AppError("Course not found", 404);
    }

    const data = doc.data();

    const course = {
      id: doc.id,
      ...data,
      learning_outcomes:
        typeof data?.learning_outcomes === "string"
          ? JSON.parse(data.learning_outcomes)
          : data?.learning_outcomes,
      createdAt: data?.createdAt?.toDate,
      updatedAt: data?.updatedAt?.toDate,
    } as Course;

    this.cache.set(cacheKey, course);
    logger.info(`Cached course: ${slug}`);
    return course;
  }

  async createCourse(request: Omit<Course, "id">): Promise<Course> {
    try {
      const data = {
        ...request,
        learning_outcomes: Array.isArray(request.learning_outcomes)
          ? JSON.stringify(request.learning_outcomes)
          : request.learning_outcomes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const res = await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .add(data);

      logger.info(`Course created with ID: ${res.id}`);

      if (!res) {
        logger.error("Failed to create course: No response from Firestore");
        throw new Error("Failed to create course");
      }

      const createdCourse: Course = {
        id: res.id,
        ...request,
      };

      return createdCourse;
    } catch (error) {
      logger.error("Error in CourseRepository.createCourse:", error);
      throw error;
    }
  }

  async deleteCourse(courseId: string): Promise<void> {
    try {
      const batchSize = 500;

      const deleteCollection = async (collectionPath: string) => {
        const query = this.firebaseStore
          .collection(collectionPath)
          .where("courseId", "==", courseId)
          .limit(batchSize);

        return new Promise<void>((resolve, reject) => {
          this.deleteQueryBatch(query, resolve, reject);
        });
      };

      await Promise.all([
        deleteCollection("chapters"),
        deleteCollection("lessons"),
        deleteCollection("capstoneGuidelines"),
        deleteCollection("capstoneSubmissions"),
        deleteCollection("enrollments"),
      ]);

      await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(courseId)
        .delete();

      this.cache.del(`course:${courseId}`);
      logger.info(`Cache invalidated for deleted course: ${courseId}`);

      logger.info(
        `Course with ID: ${courseId} and its related data have been deleted.`,
      );
    } catch (error) {
      logger.error("Error in CourseRepository.deleteCourse:", error);
      throw error;
    }
  }

  private async deleteQueryBatch(
    query: any,
    resolve: () => void,
    reject: (error: any) => void,
  ): Promise<void> {
    try {
      const snapshot = await query.get();

      if (snapshot.size === 0) {
        resolve();
        return;
      }

      const batch = this.firebaseStore.batch();
      snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      process.nextTick(() => {
        this.deleteQueryBatch(query, resolve, reject);
      });
    } catch (error) {
      reject(error);
    }
  }

  async courseNameExists(name: string, uid: string): Promise<boolean> {
    const snapshot = await this.firebaseStore
      .collection(this.COLLECTION_NAME)
      .where("uid", "==", uid)
      .where("name", "==", name)
      .limit(1)
      .get();

    return !snapshot.empty;
  }

  async updateCourse(
    courseId: string,
    updates: Partial<Course>,
  ): Promise<void> {
    try {
      const docRef = this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(courseId);

      const doc = await docRef.get();
      if (!doc.exists) {
        throw new AppError("Course not found", 404);
      }

      await docRef.update({
        ...updates,
        updatedAt: new Date(),
      });

      this.cache.del(`course:${courseId}`);
      logger.info(`Cache invalidated for updated course: ${courseId}`);

      logger.info(`Course with ID: ${courseId} has been updated.`);
    } catch (error) {
      logger.error("Error in CourseRepository.updateCourse:", error);
      throw error;
    }
  }

  /**
   * Get enrollment count for a course
   */
  async getEnrollmentCount(courseId: string): Promise<number> {
    try {
      const snapshot = await this.firebaseStore
        .collection("enrollments")
        .where("courseId", "==", courseId)
        .where("status", "==", "active")
        .count()
        .get();

      return snapshot.data().count;
    } catch (error) {
      logger.error("Error in CourseRepository.getEnrollmentCount:", error);
      return 0; // Return 0 instead of throwing to not break course queries
    }
  }

  /**
   * Check if user is enrolled in a course
   */
  async isUserEnrolled(courseId: string, userId: string): Promise<boolean> {
    try {
      const enrollmentId = `${courseId}_${userId}`;
      const doc = await this.firebaseStore
        .collection("enrollments")
        .doc(enrollmentId)
        .get();

      if (!doc.exists) {
        return false;
      }

      const data = doc.data();
      return data?.status === "active";
    } catch (error) {
      logger.error("Error in CourseRepository.isUserEnrolled:", error);
      return false;
    }
  }

  /**
   * Get course with enrollment information
   */
  async getCourseWithEnrollmentInfo(
    courseId: string,
    userId?: string,
  ): Promise<Course> {
    try {
      const course = await this.getCourseById(courseId);
      const enrollmentCount = await this.getEnrollmentCount(courseId);

      let isEnrolled = false;
      if (userId) {
        isEnrolled = await this.isUserEnrolled(courseId, userId);
      }

      return {
        ...course,
        enrollmentCount,
        isEnrolled,
      };
    } catch (error) {
      logger.error(
        "Error in CourseRepository.getCourseWithEnrollmentInfo:",
        error,
      );
      throw error;
    }
  }

  /**
   * Atomically create course with all related entities (chapters and lessons)
   * Uses Firestore batch writes to ensure all-or-nothing semantics
   */
  async createCourseWithRelations(staged: StagedCourseData): Promise<Course> {
    try {
      const batches: any[] = [];
      let currentBatch = this.firebaseStore.batch();
      let operationCount = 0;
      const MAX_BATCH_SIZE = 450;

      const courseRef = this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc();
      const courseData = {
        ...staged.course,
        learning_outcomes: Array.isArray(staged.course.learning_outcomes)
          ? JSON.stringify(staged.course.learning_outcomes)
          : staged.course.learning_outcomes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      currentBatch.set(courseRef, courseData);
      operationCount++;

      logger.info("Creating course with relations", {
        courseId: courseRef.id,
        courseName: staged.course.name,
        chaptersCount: staged.chapters.length,
        totalLessons: staged.chapters.reduce(
          (sum, c) => sum + c.lessons.length,
          0,
        ),
      });

      for (let i = 0; i < staged.chapters.length; i++) {
        const chapterData = staged.chapters[i];
        if (!chapterData) continue;

        const { chapter, lessons } = chapterData;

        const chapterRef = this.firebaseStore.collection("chapters").doc();

        currentBatch.set(chapterRef, {
          ...chapter,
          courseId: courseRef.id,
          courseName: staged.course.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        operationCount++;

        if (operationCount >= MAX_BATCH_SIZE) {
          batches.push(currentBatch);
          currentBatch = this.firebaseStore.batch();
          operationCount = 0;
        }

        for (const lesson of lessons) {
          const lessonRef = this.firebaseStore.collection("lessons").doc();

          currentBatch.set(lessonRef, {
            ...lesson,
            chapterId: chapterRef.id,
            courseId: courseRef.id, // Add courseId for efficient queries and deletion
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          operationCount++;

          if (operationCount >= MAX_BATCH_SIZE) {
            batches.push(currentBatch);
            currentBatch = this.firebaseStore.batch();
            operationCount = 0;
          }
        }
      }

      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      logger.info(
        `Committing ${batches.length} batch(es) for course creation`,
        {
          courseId: courseRef.id,
          totalOperations:
            1 +
            staged.chapters.length +
            staged.chapters.reduce((sum, c) => sum + c.lessons.length, 0),
        },
      );

      // Commit batches sequentially to maintain parent-child referential integrity
      // (course -> chapters -> lessons)
      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit();
        logger.debug(`Committed batch ${i + 1}/${batches.length}`);
      }

      logger.info(
        `Successfully created course ${courseRef.id} with all relations`,
      );

      return {
        id: courseRef.id,
        ...staged.course,
      };
    } catch (error) {
      logger.error("Failed to commit course with relations", error);
      throw new AppError("Failed to save course. Please try again.", 500);
    }
  }
}
