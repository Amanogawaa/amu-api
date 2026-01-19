import type { Firestore } from "firebase-admin/firestore";
import { firebaseFirestore } from "../../config/firebase";
import { logger } from "../../utils/loggers";
import type { RecommendationCache } from "./types";

export class RecommendationRepository {
  private firebaseStore: Firestore;
  private readonly CACHE_COLLECTION = "recommendations";

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  async getCache(
    uid: string,
    type: string,
    courseId?: string,
  ): Promise<RecommendationCache | null> {
    try {
      let query = this.firebaseStore
        .collection(this.CACHE_COLLECTION)
        .where("uid", "==", uid)
        .where("type", "==", type);

      if (courseId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = query.where("courseId", "==", courseId) as any;
      }

      const snapshot = await query.limit(1).get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return null;
      }

      const data = doc.data();

      return {
        id: doc.id,
        uid: data.uid,
        courseId: data.courseId,
        type: data.type,
        recommendations: data.recommendations,
        expiresAt: data.expiresAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as RecommendationCache;
    } catch (error) {
      logger.error("Error getting recommendation cache:", error);
      return null;
    }
  }

  async setCache(
    uid: string,
    type: string,
    recommendations: RecommendationCache["recommendations"],
    ttlHours: number = 6,
    courseId?: string,
  ): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

      const cacheData = {
        uid,
        type,
        courseId: courseId || null,
        recommendations,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      const existing = await this.getCache(uid, type, courseId);

      if (existing && existing.id) {
        await this.firebaseStore
          .collection(this.CACHE_COLLECTION)
          .doc(existing.id)
          .update({
            recommendations,
            expiresAt,
            updatedAt: now,
          });
      } else {
        await this.firebaseStore
          .collection(this.CACHE_COLLECTION)
          .add(cacheData);
      }

      logger.info("Recommendation cache set", {
        uid,
        type,
        courseId,
        count: recommendations.length,
        ttlHours,
      });
    } catch (error) {
      logger.error("Error setting recommendation cache:", error);
      throw error;
    }
  }

  async invalidateCache(
    uid: string,
    type: string,
    courseId?: string,
  ): Promise<void> {
    try {
      let query = this.firebaseStore
        .collection(this.CACHE_COLLECTION)
        .where("uid", "==", uid)
        .where("type", "==", type);

      if (courseId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = query.where("courseId", "==", courseId) as any;
      }

      const snapshot = await query.get();

      if (!snapshot.empty) {
        const batch = this.firebaseStore.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        logger.info("Recommendation cache invalidated", {
          uid,
          type,
          courseId,
          count: snapshot.size,
        });
      }
    } catch (error) {
      logger.error("Error invalidating recommendation cache:", error);
      throw error;
    }
  }

  async cleanExpiredCaches(): Promise<number> {
    try {
      const now = new Date();
      const snapshot = await this.firebaseStore
        .collection(this.CACHE_COLLECTION)
        .where("expiresAt", "<", now)
        .get();

      if (snapshot.empty) {
        return 0;
      }

      const batch = this.firebaseStore.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      logger.info("Expired recommendation caches cleaned", {
        count: snapshot.size,
      });

      return snapshot.size;
    } catch (error) {
      logger.error("Error cleaning expired caches:", error);
      throw error;
    }
  }
}
