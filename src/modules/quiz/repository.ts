import type { Firestore } from "firebase-admin/firestore";
import { firebaseFirestore } from "../../config/firebase";
import { logger } from "../../core/utils/loggers";
import type { Quiz, QuizAttempt } from "./types";

export class QuizRepository {
  private firebaseStore: Firestore;
  private readonly QUIZ_COLLECTION = "quizzes";
  private readonly ATTEMPTS_COLLECTION = "quiz_attempts";

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  async createQuiz(
    quiz: Omit<Quiz, "id" | "createdAt" | "updatedAt">,
  ): Promise<Quiz> {
    try {
      logger.info(`Creating quiz for lesson: ${quiz.lessonId}`);

      const docRef = this.firebaseStore.collection(this.QUIZ_COLLECTION).doc();
      const data = {
        ...quiz,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await docRef.set(data);

      const createdQuiz: Quiz = {
        id: docRef.id,
        ...data,
      };

      logger.info(`Quiz created successfully with id: ${docRef.id}`);
      return createdQuiz;
    } catch (error) {
      logger.error("Error in QuizRepository.createQuiz:", error);
      throw error;
    }
  }

  async getQuizById(quizId: string): Promise<Quiz | null> {
    try {
      logger.info(`Fetching quiz with id: ${quizId}`);

      const doc = await this.firebaseStore
        .collection(this.QUIZ_COLLECTION)
        .doc(quizId)
        .get();

      if (!doc.exists) {
        logger.info(`Quiz not found with id: ${quizId}`);
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      } as Quiz;
    } catch (error) {
      logger.error("Error in QuizRepository.getQuizById:", error);
      throw error;
    }
  }

  async getQuizByLessonId(lessonId: string): Promise<Quiz | null> {
    try {
      logger.info(`Fetching quiz for lesson: ${lessonId}`);

      const querySnapshot = await this.firebaseStore
        .collection(this.QUIZ_COLLECTION)
        .where("lessonId", "==", lessonId)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        logger.info(`No quiz found for lesson: ${lessonId}`);
        return null;
      }

      const doc = querySnapshot.docs[0];
      if (!doc) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      } as Quiz;
    } catch (error) {
      logger.error("Error in QuizRepository.getQuizByLessonId:", error);
      throw error;
    }
  }

  async saveAttempt(attempt: Omit<QuizAttempt, "id">): Promise<QuizAttempt> {
    try {
      logger.info(
        `Saving quiz attempt for user: ${attempt.userId}, quiz: ${attempt.quizId}`,
      );

      const docRef = this.firebaseStore
        .collection(this.ATTEMPTS_COLLECTION)
        .doc();
      const data = { ...attempt };

      await docRef.set(data);

      const savedAttempt: QuizAttempt = {
        id: docRef.id,
        ...data,
      };

      logger.info(`Quiz attempt saved successfully with id: ${docRef.id}`);
      return savedAttempt;
    } catch (error) {
      logger.error("Error in QuizRepository.saveAttempt:", error);
      throw error;
    }
  }

  async getUserAttempts(
    userId: string,
    quizId: string,
  ): Promise<QuizAttempt[]> {
    try {
      logger.info(`Fetching attempts for user: ${userId}, quiz: ${quizId}`);

      const querySnapshot = await this.firebaseStore
        .collection(this.ATTEMPTS_COLLECTION)
        .where("userId", "==", userId)
        .where("quizId", "==", quizId)
        .orderBy("completedAt", "desc")
        .get();

      if (querySnapshot.empty) {
        logger.info(`No attempts found for user: ${userId}, quiz: ${quizId}`);
        return [];
      }

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as QuizAttempt,
      );
    } catch (error) {
      logger.error("Error in QuizRepository.getUserAttempts:", error);
      throw error;
    }
  }

  async getAttemptById(attemptId: string): Promise<QuizAttempt | null> {
    try {
      logger.info(`Fetching attempt with id: ${attemptId}`);

      const doc = await this.firebaseStore
        .collection(this.ATTEMPTS_COLLECTION)
        .doc(attemptId)
        .get();

      if (!doc.exists) {
        logger.info(`Attempt not found with id: ${attemptId}`);
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      } as QuizAttempt;
    } catch (error) {
      logger.error("Error in QuizRepository.getAttemptById:", error);
      throw error;
    }
  }
}
