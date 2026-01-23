/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { firebaseFirestore } from "../../config/firebase";
import { AppError } from "../../utils/errors";
import { logger } from "../../utils/loggers";
import type { Course, CourseQueryParams } from "./types";

export class CourseRepository {
  private firebaseStore: Firestore;
  private readonly COLLECTION_NAME = "courses";

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  async getCourse(params?: CourseQueryParams): Promise<Course[]> {
    try {
      let query = this.firebaseStore.collection(this.COLLECTION_NAME);

      if (params?.uid) {
        query = query.where("uid", "==", params.uid) as any;
      }

      if (params?.search) {
        query = query
          .where("name", ">=", params.search)
          .where("name", "<=", params.search + "\uf8ff") as any;
      }

      if (params?.publish !== undefined) {
        query = query.where("publish", "==", params.publish) as any;
      }

      if (params?.draft !== undefined) {
        query = query.where("draft", "==", params.draft) as any;
      }

      if (params?.level) {
        query = query.where("level", "==", params.level) as any;
      }
      if (params?.category) {
        query = query.where("category", "==", params.category) as any;
      }
      if (params?.language) {
        query = query.where("language", "==", params.language) as any;
      }
      if (params?.limit) {
        query = query.limit(params.limit) as any;
      }
      if (params?.offset) {
        query = query.offset(params.offset) as any;
      }

      // Sort by createdAt (newest first) by default
      query = query.orderBy("createdAt", "desc") as any;

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
    const docRef = this.firebaseStore
      .collection(this.COLLECTION_NAME)
      .doc(slug);
    const doc = await docRef.get();

    if (!doc) {
      logger.info(`No course found with ID: ${slug}`);
      throw new AppError("Course not found", 404);
    }

    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      learning_outcomes:
        typeof data?.learning_outcomes === "string"
          ? JSON.parse(data.learning_outcomes)
          : data?.learning_outcomes,
      createdAt: data?.createdAt?.toDate,
      updatedAt: data?.updatedAt?.toDate,
    } as Course;
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
}
