/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { firebaseFirestore } from "../../config/firebase";
import { AppError } from "../../core/utils/errors";
import { logger } from "../../core/utils/loggers";
import type {
  CapstoneGuideline,
  CapstoneSubmission,
  CapstoneReview,
  CapstoneLike,
  CapstoneSubmissionQueryParams,
  CapstoneReviewQueryParams,
} from "./types";

export class CapstoneRepository {
  private firebaseStore: Firestore;
  private readonly GUIDELINES_COLLECTION = "capstoneGuidelines";
  private readonly SUBMISSIONS_COLLECTION = "capstoneSubmissions";
  private readonly REVIEWS_COLLECTION = "capstoneReviews";
  private readonly LIKES_COLLECTION = "capstoneLikes";

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  // ==================== CAPSTONE GUIDELINES ====================

  async createGuideline(
    guideline: Omit<CapstoneGuideline, "id" | "createdAt" | "updatedAt">,
  ): Promise<CapstoneGuideline> {
    try {
      const docRef = this.firebaseStore
        .collection(this.GUIDELINES_COLLECTION)
        .doc();

      const now = new Date();
      const guidelineData: CapstoneGuideline = {
        ...guideline,
        id: docRef.id,
        createdAt: now,
        updatedAt: now,
      };

      await docRef.set(guidelineData);
      logger.info(`Capstone guideline created: ${docRef.id}`);

      return guidelineData;
    } catch (error) {
      logger.error("Error in CapstoneRepository.createGuideline:", error);
      throw error;
    }
  }

  async getGuidelineByCourseId(
    courseId: string,
  ): Promise<CapstoneGuideline | null> {
    try {
      const snapshot = await this.firebaseStore
        .collection(this.GUIDELINES_COLLECTION)
        .where("courseId", "==", courseId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return null;
      }
      return this.serializeFirestoreDoc(doc) as CapstoneGuideline;
    } catch (error) {
      logger.error(
        "Error in CapstoneRepository.getGuidelineByCourseId:",
        error,
      );
      throw error;
    }
  }

  async getGuidelineById(id: string): Promise<CapstoneGuideline> {
    try {
      const doc = await this.firebaseStore
        .collection(this.GUIDELINES_COLLECTION)
        .doc(id)
        .get();

      if (!doc.exists) {
        throw new AppError("Capstone guideline not found", 404);
      }

      return this.serializeFirestoreDoc(doc) as CapstoneGuideline;
    } catch (error) {
      logger.error("Error in CapstoneRepository.getGuidelineById:", error);
      throw error;
    }
  }

  async updateGuideline(
    id: string,
    updates: Partial<CapstoneGuideline>,
  ): Promise<CapstoneGuideline> {
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
      logger.error("Error in CapstoneRepository.updateGuideline:", error);
      throw error;
    }
  }

  // ==================== CAPSTONE SUBMISSIONS ====================

  async createSubmission(
    submission: Omit<
      CapstoneSubmission,
      | "id"
      | "submittedAt"
      | "updatedAt"
      | "viewCount"
      | "reviewCount"
      | "likeCount"
    >,
  ): Promise<CapstoneSubmission> {
    try {
      const docRef = this.firebaseStore
        .collection(this.SUBMISSIONS_COLLECTION)
        .doc();

      const now = new Date();
      const submissionData: CapstoneSubmission = {
        ...submission,
        id: docRef.id,
        submittedAt: now,
        updatedAt: now,
        viewCount: 0,
        reviewCount: 0,
        likeCount: 0,
        screenshots: submission.screenshots || [],
      };

      await docRef.set(submissionData);
      logger.info(`Capstone submission created: ${docRef.id}`);

      return submissionData;
    } catch (error) {
      logger.error("Error in CapstoneRepository.createSubmission:", error);
      throw error;
    }
  }

  async getSubmissions(
    params?: CapstoneSubmissionQueryParams,
  ): Promise<CapstoneSubmission[]> {
    try {
      let query = this.firebaseStore.collection(
        this.SUBMISSIONS_COLLECTION,
      ) as any;

      if (params?.courseId) {
        query = query.where("courseId", "==", params.courseId);
      }

      if (params?.userId) {
        query = query.where("userId", "==", params.userId);
      }

      // Sorting
      switch (params?.sortBy) {
        case "popular":
          query = query.orderBy("likeCount", "desc");
          break;
        case "mostReviewed":
          query = query.orderBy("reviewCount", "desc");
          break;
        case "topRated":
          query = query.orderBy("averageRating", "desc");
          break;
        case "recent":
        default:
          query = query.orderBy("submittedAt", "desc");
          break;
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      if (params?.offset) {
        query = query.offset(params.offset);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        return [];
      }

      const submissions: CapstoneSubmission[] = [];
      snapshot.forEach((doc: any) => {
        submissions.push(this.serializeFirestoreDoc(doc) as CapstoneSubmission);
      });

      return submissions;
    } catch (error) {
      logger.error("Error in CapstoneRepository.getSubmissions:", error);
      throw error;
    }
  }

  async getSubmissionById(id: string): Promise<CapstoneSubmission> {
    try {
      const doc = await this.firebaseStore
        .collection(this.SUBMISSIONS_COLLECTION)
        .doc(id)
        .get();

      if (!doc.exists) {
        throw new AppError("Capstone submission not found", 404);
      }

      return this.serializeFirestoreDoc(doc) as CapstoneSubmission;
    } catch (error) {
      logger.error("Error in CapstoneRepository.getSubmissionById:", error);
      throw error;
    }
  }

  async updateSubmission(
    id: string,
    updates: Partial<CapstoneSubmission>,
  ): Promise<CapstoneSubmission> {
    try {
      const docRef = this.firebaseStore
        .collection(this.SUBMISSIONS_COLLECTION)
        .doc(id);

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await docRef.update(updateData);

      const updated = await this.getSubmissionById(id);
      return updated;
    } catch (error) {
      logger.error("Error in CapstoneRepository.updateSubmission:", error);
      throw error;
    }
  }

  async deleteSubmission(id: string): Promise<void> {
    try {
      await this.firebaseStore
        .collection(this.SUBMISSIONS_COLLECTION)
        .doc(id)
        .delete();

      logger.info(`Capstone submission deleted: ${id}`);
    } catch (error) {
      logger.error("Error in CapstoneRepository.deleteSubmission:", error);
      throw error;
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    try {
      const docRef = this.firebaseStore
        .collection(this.SUBMISSIONS_COLLECTION)
        .doc(id);

      await docRef.update({
        viewCount: FieldValue.increment(1),
      });
    } catch (error) {
      logger.error("Error in CapstoneRepository.incrementViewCount:", error);
      throw error;
    }
  }

  async submissionExistsByRepo(
    userId: string,
    githubRepoUrl: string,
  ): Promise<boolean> {
    try {
      const snapshot = await this.firebaseStore
        .collection(this.SUBMISSIONS_COLLECTION)
        .where("userId", "==", userId)
        .where("githubRepoUrl", "==", githubRepoUrl)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      logger.error(
        "Error in CapstoneRepository.submissionExistsByRepo:",
        error,
      );
      throw error;
    }
  }

  // ==================== CAPSTONE REVIEWS ====================

  async createReview(
    review: Omit<
      CapstoneReview,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "deleted"
      | "helpfulCount"
      | "replyCount"
    >,
  ): Promise<CapstoneReview> {
    try {
      const docRef = this.firebaseStore
        .collection(this.REVIEWS_COLLECTION)
        .doc();

      const now = new Date();
      const reviewData: CapstoneReview = {
        ...review,
        id: docRef.id,
        createdAt: now,
        updatedAt: now,
        deleted: false,
        helpfulCount: 0,
        replyCount: 0,
        images: review.images || [],
        rating: review.rating,
        highlights: review.highlights || [],
        suggestions: review.suggestions || [],
      };

      // Ensure parentReviewId is explicitly set to empty string for top-level reviews
      // This is important for Firestore queries to work correctly
      if (!reviewData.parentReviewId) {
        reviewData.parentReviewId = "";
      }

      const cleanedData = this.removeUndefinedValues(reviewData);

      await docRef.set(cleanedData);
      logger.info(`Capstone review created: ${docRef.id}`);

      if (!review.parentReviewId) {
        await this.incrementReviewCount(review.capstoneSubmissionId);
      }

      return reviewData;
    } catch (error) {
      logger.error("Error in CapstoneRepository.createReview:", error);
      throw error;
    }
  }

  async getReviews(
    params?: CapstoneReviewQueryParams,
  ): Promise<CapstoneReview[]> {
    try {
      let query = this.firebaseStore
        .collection(this.REVIEWS_COLLECTION)
        .where("deleted", "==", false) as any;

      if (params?.capstoneSubmissionId) {
        query = query.where(
          "capstoneSubmissionId",
          "==",
          params.capstoneSubmissionId,
        );
      }

      if (params?.reviewerId) {
        query = query.where("reviewerId", "==", params.reviewerId);
      }

      // Handle parentReviewId filtering
      // For null: get top-level reviews (where parentReviewId is null or doesn't exist)
      // For a value: get replies to that review
      // Note: Firestore's where('parentReviewId', '==', null) only matches documents where
      // the field exists and is explicitly null. If the field doesn't exist, it won't match.
      // So for top-level reviews, we query all reviews and filter in memory.
      let shouldFilterInMemory = false;

      if (params?.parentReviewId !== undefined) {
        if (params.parentReviewId === null || params.parentReviewId === "") {
          // For top-level reviews, query all reviews and filter in memory
          // This handles both cases: field is null OR field doesn't exist
          shouldFilterInMemory = true;
          logger.info("Querying for top-level reviews - will filter in memory");
        } else {
          query = query.where("parentReviewId", "==", params.parentReviewId);
        }
      }

      // Order by createdAt - note: this requires a composite index if combined with where clauses
      try {
        query = query.orderBy("createdAt", "desc");
      } catch (orderError: any) {
        // If ordering fails (e.g., missing index), log and continue without ordering
        logger.warn(
          "Failed to order reviews by createdAt, continuing without order:",
          orderError,
        );
      }

      if (params?.limit && !shouldFilterInMemory) {
        query = query.limit(params.limit);
      } else if (params?.limit && shouldFilterInMemory) {
        // Get more results to account for filtering
        query = query.limit(params.limit * 3);
      }

      if (params?.offset && !shouldFilterInMemory) {
        query = query.offset(params.offset);
      }

      let snapshot;
      try {
        snapshot = await query.get();
      } catch (queryError: any) {
        // If query fails (e.g., missing composite index), try without ordering
        logger.warn("Query failed, trying without ordering:", queryError);
        let altQuery = this.firebaseStore
          .collection(this.REVIEWS_COLLECTION)
          .where("deleted", "==", false) as any;

        if (params?.capstoneSubmissionId) {
          altQuery = altQuery.where(
            "capstoneSubmissionId",
            "==",
            params.capstoneSubmissionId,
          );
        }

        if (params?.reviewerId) {
          altQuery = altQuery.where("reviewerId", "==", params.reviewerId);
        }

        if (params?.parentReviewId && params.parentReviewId !== null) {
          altQuery = altQuery.where(
            "parentReviewId",
            "==",
            params.parentReviewId,
          );
        } else if (params?.parentReviewId === null) {
          shouldFilterInMemory = true;
        }

        if (params?.limit) {
          altQuery = altQuery.limit(
            shouldFilterInMemory ? params.limit * 3 : params.limit,
          );
        }

        snapshot = await altQuery.get();
      }

      if (snapshot.empty) {
        logger.info("No reviews found for query:", params);
        return [];
      }

      const reviews: CapstoneReview[] = [];
      snapshot.forEach((doc: any) => {
        const review = this.serializeFirestoreDoc(doc) as CapstoneReview;

        // For top-level reviews, filter in memory to handle both null and missing field
        if (shouldFilterInMemory) {
          // Include reviews where parentReviewId is null, undefined, or doesn't exist
          // Exclude reviews that have a parentReviewId value
          if (!review.parentReviewId || review.parentReviewId === null) {
            reviews.push(review);
          }
        } else {
          reviews.push(review);
        }
      });

      // Sort by createdAt if we filtered in memory (since we might have skipped ordering)
      if (shouldFilterInMemory) {
        reviews.sort((a, b) => {
          const aDate =
            a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const bDate =
            b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return bDate.getTime() - aDate.getTime();
        });

        // Apply limit and offset after filtering
        const start = params?.offset || 0;
        const end = start + (params?.limit || reviews.length);
        const paginatedReviews = reviews.slice(start, end);

        logger.info(
          `Found ${reviews.length} total reviews, returning ${paginatedReviews.length} after filtering and pagination:`,
          params,
        );
        return paginatedReviews;
      }

      logger.info(`Found ${reviews.length} reviews for query:`, params);
      return reviews;
    } catch (error) {
      logger.error("Error in CapstoneRepository.getReviews:", error);
      throw error;
    }
  }

  async getReviewById(id: string): Promise<CapstoneReview> {
    try {
      const doc = await this.firebaseStore
        .collection(this.REVIEWS_COLLECTION)
        .doc(id)
        .get();

      if (!doc.exists) {
        throw new AppError("Review not found", 404);
      }

      const review = this.serializeFirestoreDoc(doc) as CapstoneReview;

      if (review.deleted) {
        throw new AppError("Review has been deleted", 404);
      }

      return review;
    } catch (error) {
      logger.error("Error in CapstoneRepository.getReviewById:", error);
      throw error;
    }
  }

  async updateReview(
    id: string,
    updates: Partial<CapstoneReview>,
  ): Promise<CapstoneReview> {
    try {
      const docRef = this.firebaseStore
        .collection(this.REVIEWS_COLLECTION)
        .doc(id);

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      // Remove undefined values
      const cleanedData = this.removeUndefinedValues(updateData);

      await docRef.update(cleanedData);

      const updated = await this.getReviewById(id);
      return updated;
    } catch (error) {
      logger.error("Error in CapstoneRepository.updateReview:", error);
      throw error;
    }
  }

  async deleteReview(id: string): Promise<void> {
    try {
      const review = await this.getReviewById(id);

      await this.firebaseStore
        .collection(this.REVIEWS_COLLECTION)
        .doc(id)
        .update({
          deleted: true,
          updatedAt: new Date(),
        });

      // Decrement review count on submission
      await this.decrementReviewCount(review.capstoneSubmissionId);

      logger.info(`Capstone review deleted: ${id}`);
    } catch (error) {
      logger.error("Error in CapstoneRepository.deleteReview:", error);
      throw error;
    }
  }

  async reviewExists(
    reviewerId: string,
    capstoneSubmissionId: string,
  ): Promise<boolean> {
    try {
      const snapshot = await this.firebaseStore
        .collection(this.REVIEWS_COLLECTION)
        .where("reviewerId", "==", reviewerId)
        .where("capstoneSubmissionId", "==", capstoneSubmissionId)
        .where("deleted", "==", false)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      logger.error("Error in CapstoneRepository.reviewExists:", error);
      throw error;
    }
  }

  async incrementReplyCount(reviewId: string): Promise<void> {
    try {
      const docRef = this.firebaseStore
        .collection(this.REVIEWS_COLLECTION)
        .doc(reviewId);

      await docRef.update({
        replyCount: FieldValue.increment(1),
      });
    } catch (error) {
      logger.error("Error incrementing reply count:", error);
    }
  }

  async decrementReplyCount(reviewId: string): Promise<void> {
    try {
      const docRef = this.firebaseStore
        .collection(this.REVIEWS_COLLECTION)
        .doc(reviewId);

      await docRef.update({
        replyCount: FieldValue.increment(-1),
      });
    } catch (error) {
      logger.error("Error decrementing reply count:", error);
    }
  }

  private async incrementReviewCount(submissionId: string): Promise<void> {
    try {
      const docRef = this.firebaseStore
        .collection(this.SUBMISSIONS_COLLECTION)
        .doc(submissionId);

      await docRef.update({
        reviewCount: FieldValue.increment(1),
      });

      await this.updateAverageRating(submissionId);
    } catch (error) {
      logger.error("Error incrementing review count:", error);
    }
  }

  private async decrementReviewCount(submissionId: string): Promise<void> {
    try {
      const docRef = this.firebaseStore
        .collection(this.SUBMISSIONS_COLLECTION)
        .doc(submissionId);

      await docRef.update({
        reviewCount: FieldValue.increment(-1),
      });

      await this.updateAverageRating(submissionId);
    } catch (error) {
      logger.error("Error decrementing review count:", error);
    }
  }

  private async updateAverageRating(submissionId: string): Promise<void> {
    try {
      const reviews = await this.getReviews({
        capstoneSubmissionId: submissionId,
        parentReviewId: null,
      });

      const reviewsWithRatings = reviews.filter(
        (review) => review.rating !== undefined && review.rating !== null,
      );

      if (reviewsWithRatings.length === 0) {
        await this.updateSubmission(submissionId, { averageRating: undefined });
        return;
      }

      const totalRating = reviewsWithRatings.reduce(
        (sum, review) => sum + (review.rating || 0),
        0,
      );
      const averageRating = totalRating / reviewsWithRatings.length;

      await this.updateSubmission(submissionId, {
        averageRating: Math.round(averageRating * 10) / 10,
      });
    } catch (error) {
      logger.error("Error updating average rating:", error);
    }
  }

  // ==================== CAPSTONE LIKES ====================

  async toggleLike(
    userId: string,
    capstoneSubmissionId: string,
  ): Promise<boolean> {
    try {
      const likeId = `${capstoneSubmissionId}_${userId}`;
      const likeDoc = await this.firebaseStore
        .collection(this.LIKES_COLLECTION)
        .doc(likeId)
        .get();

      if (likeDoc.exists) {
        // Unlike
        await this.firebaseStore
          .collection(this.LIKES_COLLECTION)
          .doc(likeId)
          .delete();

        await this.firebaseStore
          .collection(this.SUBMISSIONS_COLLECTION)
          .doc(capstoneSubmissionId)
          .update({
            likeCount: FieldValue.increment(-1),
          });

        logger.info(`Capstone unliked: ${likeId}`);
        return false;
      } else {
        const likeData: CapstoneLike = {
          id: likeId,
          capstoneSubmissionId,
          userId,
          createdAt: new Date(),
        };

        await this.firebaseStore
          .collection(this.LIKES_COLLECTION)
          .doc(likeId)
          .set(likeData);

        await this.firebaseStore
          .collection(this.SUBMISSIONS_COLLECTION)
          .doc(capstoneSubmissionId)
          .update({
            likeCount: FieldValue.increment(1),
          });

        logger.info(`Capstone liked: ${likeId}`);
        return true;
      }
    } catch (error) {
      logger.error("Error in CapstoneRepository.toggleLike:", error);
      throw error;
    }
  }

  async isLikedByUser(
    userId: string,
    capstoneSubmissionId: string,
  ): Promise<boolean> {
    try {
      const likeId = `${capstoneSubmissionId}_${userId}`;
      const doc = await this.firebaseStore
        .collection(this.LIKES_COLLECTION)
        .doc(likeId)
        .get();

      return doc.exists;
    } catch (error) {
      logger.error("Error in CapstoneRepository.isLikedByUser:", error);
      throw error;
    }
  }

  async getLikeCount(capstoneSubmissionId: string): Promise<number> {
    try {
      const submission = await this.getSubmissionById(capstoneSubmissionId);
      return submission.likeCount || 0;
    } catch (error) {
      logger.error("Error in CapstoneRepository.getLikeCount:", error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  private removeUndefinedValues<T extends Record<string, any>>(obj: T): T {
    const cleaned: any = {};

    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    }

    return cleaned as T;
  }

  private serializeFirestoreDoc(doc: any): any {
    const data = doc.data();
    const serialized: any = { id: doc.id };

    for (const key in data) {
      const value = data[key];
      if (value && typeof value === "object" && value.toDate) {
        serialized[key] = value.toDate().toISOString();
      } else {
        serialized[key] = value;
      }
    }

    return serialized;
  }
}
