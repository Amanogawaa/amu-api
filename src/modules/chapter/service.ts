import { convexClient, api } from "../../core/convex";
import type {
  CreateChapterDTO,
  UpdateChapterDTO,
  Chapter,
  ChapterWithLessons,
} from "./types";
import { ChapterValidation } from "./validation";
import { logger } from "../../core/utils/loggers";

export class ChapterService {
  /**
   * Get a single chapter by ID
   */
  async getChapterById(id: string): Promise<Chapter> {
    try {
      const chapter = await convexClient.query(
        (api as any).chapters.getChapter,
        {
          id,
        },
      );

      if (!chapter) {
        throw new Error("Chapter not found");
      }

      return chapter;
    } catch (error) {
      logger.error("Error fetching chapter:", error);
      throw error;
    }
  }

  /**
   * Get all chapters for a course
   */
  async getChaptersByCourse(courseId: string): Promise<Chapter[]> {
    try {
      const chapters = await convexClient.query(
        (api as any).chapters.getChaptersByCourse,
        {
          courseId,
        },
      );

      return chapters;
    } catch (error) {
      logger.error("Error fetching chapters by course:", error);
      throw error;
    }
  }

  /**
   * Get chapter with lesson details
   */
  async getChapterWithLessons(id: string): Promise<ChapterWithLessons> {
    try {
      const chapterData = await convexClient.query(
        (api as any).chapters.getChapterWithLessons,
        {
          id,
        },
      );

      if (!chapterData) {
        throw new Error("Chapter not found");
      }

      return chapterData;
    } catch (error) {
      logger.error("Error fetching chapter with lessons:", error);
      throw error;
    }
  }

  /**
   * Create a new chapter
   */
  async createChapter(data: CreateChapterDTO): Promise<Chapter> {
    try {
      ChapterValidation.validateCreateChapter(data);

      const chapter = await convexClient.mutation(
        (api as any).chapters.createChapter,
        data,
      );

      logger.info(`Chapter created: ${chapter._id}`);
      return chapter;
    } catch (error) {
      logger.error("Error creating chapter:", error);
      throw error;
    }
  }

  /**
   * Update an existing chapter
   */
  async updateChapter(id: string, data: UpdateChapterDTO): Promise<Chapter> {
    try {
      ChapterValidation.validateUpdateChapter(data);

      const updated = await convexClient.mutation(
        (api as any).chapters.updateChapter,
        {
          id,
          updates: data,
        },
      );

      logger.info(`Chapter updated: ${id}`);
      return updated;
    } catch (error) {
      logger.error("Error updating chapter:", error);
      throw error;
    }
  }

  /**
   * Delete a chapter
   */
  async deleteChapter(id: string): Promise<void> {
    try {
      await convexClient.mutation((api as any).chapters.deleteChapter, {
        id,
      });

      logger.info(`Chapter deleted: ${id}`);
    } catch (error) {
      logger.error("Error deleting chapter:", error);
      throw error;
    }
  }
}
