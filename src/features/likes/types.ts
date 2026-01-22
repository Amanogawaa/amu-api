export interface Like {
  id: string;
  courseId: string;
  userId: string;
  createdAt: Date;
}

export interface LikeToggleRequest {
  courseId: string;
}

export interface LikeResponse {
  data: {
    liked: boolean;
    likesCount: number;
  };
  message: string;
}

export interface LikesListResponse {
  data: {
    likes: Like[];
    total: number;
  };
  message: string;
}

export interface LikeStatusResponse {
  data: {
    liked: boolean;
    likesCount: number;
  };
  message: string;
}
