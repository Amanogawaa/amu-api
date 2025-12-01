import type { UserProgress } from "./types";

export class ProgressRepository {
  private db: FirebaseFirestore.Firestore;
  private collectionName = "userProgress";

  constructor(firestore: FirebaseFirestore.Firestore) {
    this.db = firestore;
  }

  private getProgressId(courseId: string, userId: string): string {
    return `${courseId}_${userId}`;
  }

  async getProgressByUser(userId: string): Promise<UserProgress[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where("userId", "==", userId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      lastActivityAt: doc.data().lastActivityAt?.toDate(),
      enrolledAt: doc.data().enrolledAt?.toDate(),
    })) as UserProgress[];
  }

  async getProgressByCourse(
    courseId: string,
    userId: string,
  ): Promise<UserProgress | null> {
    const progressId = this.getProgressId(courseId, userId);
    const doc = await this.db
      .collection(this.collectionName)
      .doc(progressId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
      lastActivityAt: doc.data()?.lastActivityAt?.toDate(),
      enrolledAt: doc.data()?.enrolledAt?.toDate(),
    } as UserProgress;
  }

  async createProgress(
    progress: Omit<UserProgress, "id">,
  ): Promise<UserProgress> {
    const progressId = this.getProgressId(progress.courseId, progress.userId);
    const now = new Date();

    const progressData = {
      ...progress,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };

    await this.db
      .collection(this.collectionName)
      .doc(progressId)
      .set(progressData);

    return {
      id: progressId,
      ...progressData,
    };
  }

  async updateProgress(
    courseId: string,
    userId: string,
    updates: Partial<UserProgress>,
  ): Promise<UserProgress> {
    const progressId = this.getProgressId(courseId, userId);
    const now = new Date();

    const updateData = {
      ...updates,
      updatedAt: now,
      lastActivityAt: now,
    };

    await this.db
      .collection(this.collectionName)
      .doc(progressId)
      .update(updateData);

    const updated = await this.getProgressByCourse(courseId, userId);
    if (!updated) {
      throw new Error("Failed to retrieve updated progress");
    }

    return updated;
  }

  async deleteProgress(courseId: string, userId: string): Promise<void> {
    const progressId = this.getProgressId(courseId, userId);
    await this.db.collection(this.collectionName).doc(progressId).delete();
  }

  async getAllProgressForCourse(courseId: string): Promise<UserProgress[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where("courseId", "==", courseId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      lastActivityAt: doc.data().lastActivityAt?.toDate(),
      enrolledAt: doc.data().enrolledAt?.toDate(),
    })) as UserProgress[];
  }
}
