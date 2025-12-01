import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { Like } from "./types";
import { firebaseFirestore } from "../../config/firebase";

export class LikesRepository {
  private firebaseStore: Firestore;
  private likesCollection = "likes";
  private coursesCollection = "courses";

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  private getLikeId(courseId: string, userId: string): string {
    return `${courseId}_${userId}`;
  }

  async getLike(courseId: string, userId: string): Promise<Like | null> {
    const likeId = this.getLikeId(courseId, userId);
    const doc = await this.firebaseStore
      .collection(this.likesCollection)
      .doc(likeId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
    } as Like;
  }

  async createLike(courseId: string, userId: string): Promise<Like> {
    const likeId = this.getLikeId(courseId, userId);
    const now = new Date();

    const likeData = {
      courseId,
      userId,
      createdAt: now,
    };

    const batch = this.firebaseStore.batch();

    const likeRef = this.firebaseStore
      .collection(this.likesCollection)
      .doc(likeId);
    batch.set(likeRef, likeData);

    const courseRef = this.firebaseStore
      .collection(this.coursesCollection)
      .doc(courseId);
    batch.update(courseRef, {
      likesCount: FieldValue.increment(1),
    });

    await batch.commit();

    return {
      id: likeId,
      ...likeData,
    };
  }

  async deleteLike(courseId: string, userId: string): Promise<void> {
    const likeId = this.getLikeId(courseId, userId);

    const batch = this.firebaseStore.batch();

    const likeRef = this.firebaseStore
      .collection(this.likesCollection)
      .doc(likeId);
    batch.delete(likeRef);

    const courseRef = this.firebaseStore
      .collection(this.coursesCollection)
      .doc(courseId);
    batch.update(courseRef, {
      likesCount: FieldValue.increment(-1),
    });

    await batch.commit();
  }

  async getLikesForCourse(
    courseId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ likes: Like[]; total: number }> {
    const snapshot = await this.firebaseStore
      .collection(this.likesCollection)
      .where("courseId", "==", courseId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    const likes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Like[];

    const countSnapshot = await this.firebaseStore
      .collection(this.likesCollection)
      .where("courseId", "==", courseId)
      .count()
      .get();

    return {
      likes,
      total: countSnapshot.data().count,
    };
  }

  async getLikesCount(courseId: string): Promise<number> {
    const courseDoc = await this.firebaseStore
      .collection(this.coursesCollection)
      .doc(courseId)
      .get();

    return courseDoc.data()?.likesCount || 0;
  }

  async getLikesByUser(userId: string): Promise<Like[]> {
    const snapshot = await this.firebaseStore
      .collection(this.likesCollection)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Like[];
  }
}
