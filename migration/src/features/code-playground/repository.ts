import type { Firestore } from "firebase-admin/firestore";
import { firebaseFirestore } from "../../config/firebase";
import { AppError } from "../../utils/errors";
import { logger } from "../../utils/loggers";
import type { ExerciseGuideline, ExerciseSubmission } from "./types";

export class CodePlaygroundRepository {
  private firebaseStore: Firestore;
  private readonly GUIDELINES_COLLECTION = "exerciseGuidelines";
  private readonly SUBMISSIONS_COLLECTION = "exerciseSubmissions";

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  async createGuideline(
    guideline: Omit<ExerciseGuideline, "id" | "createdAt" | "updatedAt">,
  ): Promise<ExerciseGuideline> {
    try {
      const docRef = this.firebaseStore
        .collection(this.GUIDELINES_COLLECTION)
        .doc();

      const now = new Date();
      const guidelineData: ExerciseGuideline = {
        ...guideline,
        id: docRef.id,
        createdAt: now,
        updatedAt: now,
      };

      await docRef.set(guidelineData);
      logger.info(`Exercise guideline created: ${docRef.id}`);

      return guidelineData;
    } catch (error) {
      logger.error("Error in CodePlaygroundRepository.createGuideline:", error);
      throw error;
    }
  }

  async getGuidelineByLessonId(
    lessonId: string,
  ): Promise<ExerciseGuideline | null> {
    try {
      const snapshot = await this.firebaseStore
        .collection(this.GUIDELINES_COLLECTION)
        .where("lessonId", "==", lessonId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return null;
      }

      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ExerciseGuideline;
    } catch (error) {
      logger.error(
        "Error in CodePlaygroundRepository.getGuidelineByLessonId:",
        error,
      );
      throw error;
    }
  }

  async getGuidelineById(id: string): Promise<ExerciseGuideline> {
    try {
      const doc = await this.firebaseStore
        .collection(this.GUIDELINES_COLLECTION)
        .doc(id)
        .get();

      if (!doc.exists) {
        throw new AppError("Exercise guideline not found", 404);
      }

      const data = doc.data();
      if (!data) throw new AppError("Exercise guideline not found", 404);

      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ExerciseGuideline;
    } catch (error) {
      logger.error(
        "Error in CodePlaygroundRepository.getGuidelineById:",
        error,
      );
      throw error;
    }
  }

  async getGuidelinesByCourseId(
    courseId: string,
  ): Promise<ExerciseGuideline[]> {
    try {
      const snapshot = await this.firebaseStore
        .collection(this.GUIDELINES_COLLECTION)
        .where("courseId", "==", courseId)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ExerciseGuideline;
      });
    } catch (error) {
      logger.error(
        "Error in CodePlaygroundRepository.getGuidelinesByCourseId:",
        error,
      );
      throw error;
    }
  }

  async updateGuideline(
    id: string,
    updates: Partial<ExerciseGuideline>,
  ): Promise<ExerciseGuideline> {
    try {
      const docRef = this.firebaseStore
        .collection(this.GUIDELINES_COLLECTION)
        .doc(id);

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await docRef.update(updateData);

      const updated = await this.getGuidelineById(id);
      return updated;
    } catch (error) {
      logger.error("Error in CodePlaygroundRepository.updateGuideline:", error);
      throw error;
    }
  }

  // ==================== EXERCISE SUBMISSIONS ====================

  async createSubmission(
    submission: Omit<
      ExerciseSubmission,
      "id" | "submittedAt" | "createdAt" | "updatedAt"
    >,
  ): Promise<ExerciseSubmission> {
    try {
      const docRef = this.firebaseStore
        .collection(this.SUBMISSIONS_COLLECTION)
        .doc();

      const now = new Date();
      const submissionData: ExerciseSubmission = {
        ...submission,
        id: docRef.id,
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      await docRef.set(submissionData);
      logger.info(`Exercise submission created: ${docRef.id}`);

      return submissionData;
    } catch (error) {
      logger.error(
        "Error in CodePlaygroundRepository.createSubmission:",
        error,
      );
      throw error;
    }
  }

  async getSubmissionByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<ExerciseSubmission | null> {
    try {
      const snapshot = await this.firebaseStore
        .collection(this.SUBMISSIONS_COLLECTION)
        .where("userId", "==", userId)
        .where("lessonId", "==", lessonId)
        .orderBy("submittedAt", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return null;
      }

      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        submittedAt: data.submittedAt?.toDate() || new Date(),
      } as ExerciseSubmission;
    } catch (error) {
      logger.error(
        "Error in CodePlaygroundRepository.getSubmissionByUserAndLesson:",
        error,
      );
      throw error;
    }
  }

  async getSubmissionById(id: string): Promise<ExerciseSubmission> {
    try {
      const doc = await this.firebaseStore
        .collection(this.SUBMISSIONS_COLLECTION)
        .doc(id)
        .get();

      if (!doc.exists) {
        throw new AppError("Exercise submission not found", 404);
      }

      const data = doc.data();
      if (!data) throw new AppError("Exercise submission not found", 404);

      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        submittedAt: data.submittedAt?.toDate() || new Date(),
      } as ExerciseSubmission;
    } catch (error) {
      logger.error(
        "Error in CodePlaygroundRepository.getSubmissionById:",
        error,
      );
      throw error;
    }
  }
}
