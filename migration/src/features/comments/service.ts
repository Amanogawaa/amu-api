import { AppError } from "../../utils/errors";
import type { CommentsRepository } from "./repository";
import type {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "./types";

export class CommentsService {
  constructor(private repository: CommentsRepository) {}

  async createComment(
    data: CreateCommentRequest,
    authorId: string,
    authorName?: string,
    authorEmail?: string,
  ): Promise<Comment> {
    if (data.parentId) {
      const parentComment = await this.repository.getCommentById(data.parentId);
      if (!parentComment) {
        throw new AppError("Parent comment not found", 404);
      }
      if (parentComment.courseId !== data.courseId) {
        throw new AppError("Parent comment belongs to different course", 400);
      }
    }

    return this.repository.createComment(
      data,
      authorId,
      authorName,
      authorEmail,
    );
  }

  async getCommentsForCourse(
    courseId: string,
    limit = 20,
    offset = 0,
    parentId?: string | null,
  ): Promise<{ comments: Comment[]; total: number }> {
    return this.repository.getCommentsForCourse(
      courseId,
      limit,
      offset,
      parentId,
    );
  }

  async getCommentById(commentId: string): Promise<Comment> {
    const comment = await this.repository.getCommentById(commentId);
    if (!comment) {
      throw new AppError("Comment not found", 404);
    }
    return comment;
  }

  async updateComment(
    commentId: string,
    data: UpdateCommentRequest,
    userId: string,
  ): Promise<Comment> {
    const comment = await this.repository.getCommentById(commentId);
    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    if (comment.authorId !== userId) {
      throw new AppError("Not authorized to update this comment", 403);
    }

    return this.repository.updateComment(commentId, data);
  }

  async deleteComment(
    commentId: string,
    userId: string,
    isCourseOwner = false,
  ): Promise<void> {
    const comment = await this.repository.getCommentById(commentId);
    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    if (comment.authorId !== userId && !isCourseOwner) {
      throw new AppError("Not authorized to delete this comment", 403);
    }

    await this.repository.deleteComment(commentId, comment.courseId);
  }

  async getCommentsByUser(userId: string): Promise<Comment[]> {
    return this.repository.getCommentsByUser(userId);
  }

  async getReplies(parentId: string): Promise<Comment[]> {
    return this.repository.getReplies(parentId);
  }
}
