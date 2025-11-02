export interface Comment {
  id: string;
  courseId: string;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  content: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
}

export interface CreateCommentRequest {
  courseId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CommentResponse {
  data: Comment;
  message: string;
}

export interface CommentsListResponse {
  data: {
    comments: Comment[];
    total: number;
  };
  message: string;
}

export interface CommentQueryParams {
  limit?: number;
  offset?: number;
  parentId?: string | null;
}
