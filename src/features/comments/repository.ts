import type {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
} from './types';

export class CommentsRepository {
  private db: FirebaseFirestore.Firestore;
  private commentsCollection = 'comments';
  private coursesCollection = 'courses';

  constructor(firestore: FirebaseFirestore.Firestore) {
    this.db = firestore;
  }

  async createComment(
    data: CreateCommentRequest,
    authorId: string,
    authorName?: string,
    authorEmail?: string
  ): Promise<Comment> {
    const now = new Date();
    const commentData = {
      courseId: data.courseId,
      authorId,
      authorName: authorName || 'Anonymous',
      authorEmail: authorEmail || '',
      content: data.content,
      parentId: data.parentId || null,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };

    // Use batch to atomically create comment and increment count
    const batch = this.db.batch();

    const commentRef = this.db.collection(this.commentsCollection).doc();
    batch.set(commentRef, commentData);

    const courseRef = this.db
      .collection(this.coursesCollection)
      .doc(data.courseId);
    batch.update(courseRef, {
      commentsCount: FirebaseFirestore.FieldValue.increment(1),
    });

    await batch.commit();

    return {
      id: commentRef.id,
      ...commentData,
    };
  }

  async getCommentById(commentId: string): Promise<Comment | null> {
    const doc = await this.db
      .collection(this.commentsCollection)
      .doc(commentId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
    } as Comment;
  }

  async getCommentsForCourse(
    courseId: string,
    limit = 20,
    offset = 0,
    parentId?: string | null
  ): Promise<{ comments: Comment[]; total: number }> {
    let query = this.db
      .collection(this.commentsCollection)
      .where('courseId', '==', courseId)
      .where('deleted', '==', false);

    if (parentId !== undefined) {
      query = query.where('parentId', '==', parentId || null);
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Comment[];

    let countQuery = this.db
      .collection(this.commentsCollection)
      .where('courseId', '==', courseId)
      .where('deleted', '==', false);

    if (parentId !== undefined) {
      countQuery = countQuery.where('parentId', '==', parentId || null);
    }

    const countSnapshot = await countQuery.count().get();

    return {
      comments,
      total: countSnapshot.data().count,
    };
  }

  async updateComment(
    commentId: string,
    data: UpdateCommentRequest
  ): Promise<Comment> {
    const now = new Date();

    await this.db.collection(this.commentsCollection).doc(commentId).update({
      content: data.content,
      updatedAt: now,
    });

    const updated = await this.getCommentById(commentId);
    if (!updated) {
      throw new Error('Failed to retrieve updated comment');
    }

    return updated;
  }

  async deleteComment(commentId: string, courseId: string): Promise<void> {
    // Soft delete
    const batch = this.db.batch();

    const commentRef = this.db
      .collection(this.commentsCollection)
      .doc(commentId);
    batch.update(commentRef, {
      deleted: true,
      updatedAt: new Date(),
    });

    const courseRef = this.db.collection(this.coursesCollection).doc(courseId);
    batch.update(courseRef, {
      commentsCount: FirebaseFirestore.FieldValue.increment(-1),
    });

    await batch.commit();
  }

  async getCommentsByUser(userId: string): Promise<Comment[]> {
    const snapshot = await this.db
      .collection(this.commentsCollection)
      .where('authorId', '==', userId)
      .where('deleted', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Comment[];
  }

  async getReplies(parentId: string): Promise<Comment[]> {
    const snapshot = await this.db
      .collection(this.commentsCollection)
      .where('parentId', '==', parentId)
      .where('deleted', '==', false)
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Comment[];
  }
}
