import { AppError } from "../../utils/errors";
import type { LikesRepository } from "./repository";
import type { Like } from "./types";

export class LikesService {
  constructor(private repository: LikesRepository) {}

  async toggleLike(
    courseId: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    const existingLike = await this.repository.getLike(courseId, userId);

    if (existingLike) {
      await this.repository.deleteLike(courseId, userId);
      const likesCount = await this.repository.getLikesCount(courseId);
      return { liked: false, likesCount };
    } else {
      await this.repository.createLike(courseId, userId);
      const likesCount = await this.repository.getLikesCount(courseId);
      return { liked: true, likesCount };
    }
  }

  async getLikeStatus(
    courseId: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    const like = await this.repository.getLike(courseId, userId);
    const likesCount = await this.repository.getLikesCount(courseId);

    return {
      liked: !!like,
      likesCount,
    };
  }

  async getLikesForCourse(
    courseId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ likes: Like[]; total: number }> {
    return this.repository.getLikesForCourse(courseId, limit, offset);
  }

  async getLikesByUser(userId: string): Promise<Like[]> {
    return this.repository.getLikesByUser(userId);
  }

  async getLikesCount(courseId: string): Promise<number> {
    return this.repository.getLikesCount(courseId);
  }
}
