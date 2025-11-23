import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { firebaseFirestore } from '../../config/firebase';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/loggers';
import type {
  CapstoneGuideline,
  CapstoneSubmission,
  CapstoneReview,
  CapstoneLike,
  CapstoneSubmissionQueryParams,
  CapstoneReviewQueryParams,
} from './types';

export class CapstoneRepository {
  private firebaseStore: Firestore;
  private readonly GUIDELINES_COLLECTION = 'capstoneGuidelines';
  private readonly SUBMISSIONS_COLLECTION = 'capstoneSubmissions';
  private readonly REVIEWS_COLLECTION = 'capstoneReviews';
  private readonly LIKES_COLLECTION = 'capstoneLikes';

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  // ==================== CAPSTONE GUIDELINES ====================

  async createGuideline(
    guideline: Omit<CapstoneGuideline, 'id' | 'createdAt' | 'updatedAt'>
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
      logger.error('Error in CapstoneRepository.createGuideline:', error);
      throw error;
    }
  }

  async getGuidelineByCourseId(
    courseId: string
  ): Promise<CapstoneGuideline | null> {
    try {
      const snapshot = await this.firebaseStore
        .collection(this.GUIDELINES_COLLECTION)
        .where('courseId', '==', courseId)
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
        'Error in CapstoneRepository.getGuidelineByCourseId:',
        error
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
        throw new AppError('Capstone guideline not found', 404);
      }

      return this.serializeFirestoreDoc(doc) as CapstoneGuideline;
    } catch (error) {
      logger.error('Error in CapstoneRepository.getGuidelineById:', error);
      throw error;
    }
  }

  async updateGuideline(
    id: string,
    updates: Partial<CapstoneGuideline>
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
      logger.error('Error in CapstoneRepository.updateGuideline:', error);
      throw error;
    }
  }

  // ==================== CAPSTONE SUBMISSIONS ====================

  async createSubmission(
    submission: Omit<
      CapstoneSubmission,
      | 'id'
      | 'submittedAt'
      | 'updatedAt'
      | 'viewCount'
      | 'reviewCount'
      | 'likeCount'
    >
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
      };

      await docRef.set(submissionData);
      logger.info(`Capstone submission created: ${docRef.id}`);

      return submissionData;
    } catch (error) {
      logger.error('Error in CapstoneRepository.createSubmission:', error);
      throw error;
    }
  }

  async getSubmissions(
    params?: CapstoneSubmissionQueryParams
  ): Promise<CapstoneSubmission[]> {
    try {
      let query = this.firebaseStore.collection(
        this.SUBMISSIONS_COLLECTION
      ) as any;

      if (params?.courseId) {
        query = query.where('courseId', '==', params.courseId);
      }

      if (params?.userId) {
        query = query.where('userId', '==', params.userId);
      }

      // Sorting
      switch (params?.sortBy) {
        case 'popular':
          query = query.orderBy('likeCount', 'desc');
          break;
        case 'mostReviewed':
          query = query.orderBy('reviewCount', 'desc');
          break;
        case 'topRated':
          query = query.orderBy('averageRating', 'desc');
          break;
        case 'recent':
        default:
          query = query.orderBy('submittedAt', 'desc');
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
      logger.error('Error in CapstoneRepository.getSubmissions:', error);
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
        throw new AppError('Capstone submission not found', 404);
      }

      return this.serializeFirestoreDoc(doc) as CapstoneSubmission;
    } catch (error) {
      logger.error('Error in CapstoneRepository.getSubmissionById:', error);
      throw error;
    }
  }

  async updateSubmission(
    id: string,
    updates: Partial<CapstoneSubmission>
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
      logger.error('Error in CapstoneRepository.updateSubmission:', error);
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
      logger.error('Error in CapstoneRepository.deleteSubmission:', error);
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
      logger.error('Error in CapstoneRepository.incrementViewCount:', error);
      throw error;
    }
  }

  async submissionExistsByRepo(
    userId: string,
    githubRepoUrl: string
  ): Promise<boolean> {
    try {
      const snapshot = await this.firebaseStore
        .collection(this.SUBMISSIONS_COLLECTION)
        .where('userId', '==', userId)
        .where('githubRepoUrl', '==', githubRepoUrl)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      logger.error(
        'Error in CapstoneRepository.submissionExistsByRepo:',
        error
      );
      throw error;
    }
  }

  // ==================== CAPSTONE REVIEWS ====================

  async createReview(
    review: Omit<
      CapstoneReview,
      'id' | 'createdAt' | 'updatedAt' | 'deleted' | 'helpfulCount'
    >
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
      };

      // Remove undefined values (Firestore doesn't accept them)
      const cleanedData = this.removeUndefinedValues(reviewData);

      await docRef.set(cleanedData);
      logger.info(`Capstone review created: ${docRef.id}`);

      // Increment review count on submission
      await this.incrementReviewCount(review.capstoneSubmissionId);

      return reviewData;
    } catch (error) {
      logger.error('Error in CapstoneRepository.createReview:', error);
      throw error;
    }
  }

  async getReviews(
    params?: CapstoneReviewQueryParams
  ): Promise<CapstoneReview[]> {
    try {
      let query = this.firebaseStore
        .collection(this.REVIEWS_COLLECTION)
        .where('deleted', '==', false) as any;

      if (params?.capstoneSubmissionId) {
        query = query.where(
          'capstoneSubmissionId',
          '==',
          params.capstoneSubmissionId
        );
      }

      if (params?.reviewerId) {
        query = query.where('reviewerId', '==', params.reviewerId);
      }

      query = query.orderBy('createdAt', 'desc');

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

      const reviews: CapstoneReview[] = [];
      snapshot.forEach((doc: any) => {
        reviews.push(this.serializeFirestoreDoc(doc) as CapstoneReview);
      });

      return reviews;
    } catch (error) {
      logger.error('Error in CapstoneRepository.getReviews:', error);
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
        throw new AppError('Review not found', 404);
      }

      const review = this.serializeFirestoreDoc(doc) as CapstoneReview;

      if (review.deleted) {
        throw new AppError('Review has been deleted', 404);
      }

      return review;
    } catch (error) {
      logger.error('Error in CapstoneRepository.getReviewById:', error);
      throw error;
    }
  }

  async updateReview(
    id: string,
    updates: Partial<CapstoneReview>
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
      logger.error('Error in CapstoneRepository.updateReview:', error);
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
      logger.error('Error in CapstoneRepository.deleteReview:', error);
      throw error;
    }
  }

  async reviewExists(
    reviewerId: string,
    capstoneSubmissionId: string
  ): Promise<boolean> {
    try {
      const snapshot = await this.firebaseStore
        .collection(this.REVIEWS_COLLECTION)
        .where('reviewerId', '==', reviewerId)
        .where('capstoneSubmissionId', '==', capstoneSubmissionId)
        .where('deleted', '==', false)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      logger.error('Error in CapstoneRepository.reviewExists:', error);
      throw error;
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

      // Recalculate average rating
      await this.updateAverageRating(submissionId);
    } catch (error) {
      logger.error('Error incrementing review count:', error);
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

      // Recalculate average rating
      await this.updateAverageRating(submissionId);
    } catch (error) {
      logger.error('Error decrementing review count:', error);
    }
  }

  private async updateAverageRating(submissionId: string): Promise<void> {
    try {
      const reviews = await this.getReviews({
        capstoneSubmissionId: submissionId,
      });

      if (reviews.length === 0) {
        await this.updateSubmission(submissionId, { averageRating: undefined });
        return;
      }

      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = totalRating / reviews.length;

      await this.updateSubmission(submissionId, {
        averageRating: Math.round(averageRating * 10) / 10,
      });
    } catch (error) {
      logger.error('Error updating average rating:', error);
    }
  }

  // ==================== CAPSTONE LIKES ====================

  async toggleLike(
    userId: string,
    capstoneSubmissionId: string
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
      logger.error('Error in CapstoneRepository.toggleLike:', error);
      throw error;
    }
  }

  async isLikedByUser(
    userId: string,
    capstoneSubmissionId: string
  ): Promise<boolean> {
    try {
      const likeId = `${capstoneSubmissionId}_${userId}`;
      const doc = await this.firebaseStore
        .collection(this.LIKES_COLLECTION)
        .doc(likeId)
        .get();

      return doc.exists;
    } catch (error) {
      logger.error('Error in CapstoneRepository.isLikedByUser:', error);
      throw error;
    }
  }

  async getLikeCount(capstoneSubmissionId: string): Promise<number> {
    try {
      const submission = await this.getSubmissionById(capstoneSubmissionId);
      return submission.likeCount || 0;
    } catch (error) {
      logger.error('Error in CapstoneRepository.getLikeCount:', error);
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
      if (value && typeof value === 'object' && value.toDate) {
        serialized[key] = value.toDate().toISOString();
      } else {
        serialized[key] = value;
      }
    }

    return serialized;
  }
}
