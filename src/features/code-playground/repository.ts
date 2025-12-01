import type { Firestore } from "firebase-admin/firestore";
import { firebaseFirestore } from "../../config/firebase";
import type { CodeWorkspace, SaveWorkspaceRequest } from "./types";

export class CodePlaygroundRepository {
  private firebaseStore: Firestore;
  private readonly COLLECTION_NAME = "code_workspaces";

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  async saveWorkspace(
    workspaceData: SaveWorkspaceRequest,
    workspaceId?: string,
  ): Promise<CodeWorkspace> {
    const now = new Date();

    let createdAt = now;
    if (workspaceId) {
      const existing = await this.getWorkspace(workspaceId);
      if (existing) {
        createdAt = existing.createdAt;
      }
    }

    const workspace: Omit<CodeWorkspace, "id"> = {
      userId: workspaceData.userId,
      lessonId: workspaceData.lessonId,
      courseId: workspaceData.courseId,
      code: workspaceData.code,
      language: workspaceData.language,
      createdAt,
      updatedAt: now,
    };

    const docRef = workspaceId
      ? this.firebaseStore.collection(this.COLLECTION_NAME).doc(workspaceId)
      : this.firebaseStore.collection(this.COLLECTION_NAME).doc();

    await docRef.set(workspace);

    return {
      id: docRef.id,
      ...workspace,
    };
  }

  async getWorkspace(workspaceId: string): Promise<CodeWorkspace | null> {
    const doc = await this.firebaseStore
      .collection(this.COLLECTION_NAME)
      .doc(workspaceId)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastRun: data.lastRun
        ? {
            ...data.lastRun,
            timestamp: data.lastRun.timestamp?.toDate() || new Date(),
          }
        : undefined,
    } as CodeWorkspace;
  }

  async getWorkspaceByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<CodeWorkspace | null> {
    const snapshot = await this.firebaseStore
      .collection(this.COLLECTION_NAME)
      .where("userId", "==", userId)
      .where("lessonId", "==", lessonId)
      .orderBy("updatedAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    if (!doc) return null;

    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastRun: data.lastRun
        ? {
            ...data.lastRun,
            timestamp: data.lastRun.timestamp?.toDate() || new Date(),
          }
        : undefined,
    } as CodeWorkspace;
  }

  async getWorkspacesByCourse(
    userId: string,
    courseId: string,
  ): Promise<CodeWorkspace[]> {
    const snapshot = await this.firebaseStore
      .collection(this.COLLECTION_NAME)
      .where("userId", "==", userId)
      .where("courseId", "==", courseId)
      .orderBy("updatedAt", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastRun: data.lastRun
          ? {
              ...data.lastRun,
              timestamp: data.lastRun.timestamp?.toDate() || new Date(),
            }
          : undefined,
      } as CodeWorkspace;
    });
  }

  async updateLastRun(
    workspaceId: string,
    runData: {
      output: string;
      error?: string;
      executionTime: number;
      status: "success" | "error" | "timeout";
    },
  ): Promise<void> {
    await this.firebaseStore
      .collection(this.COLLECTION_NAME)
      .doc(workspaceId)
      .update({
        lastRun: {
          ...runData,
          timestamp: new Date(),
        },
        updatedAt: new Date(),
      });
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await this.firebaseStore
      .collection(this.COLLECTION_NAME)
      .doc(workspaceId)
      .delete();
  }

  async deleteWorkspacesByLesson(
    userId: string,
    lessonId: string,
  ): Promise<void> {
    const snapshot = await this.firebaseStore
      .collection(this.COLLECTION_NAME)
      .where("userId", "==", userId)
      .where("lessonId", "==", lessonId)
      .get();

    const deletePromises = snapshot.docs.map((doc) => doc.ref.delete());

    await Promise.all(deletePromises);
  }
}
