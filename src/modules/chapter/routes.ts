import { Router } from "express";
import { ChapterController } from "./controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { courseOwnershipMiddleware } from "../../core/middlewares/ownership.middle";

export class ChapterRoutes {
  public router: Router;
  private chapterController: ChapterController;

  constructor(chapterController: ChapterController) {
    this.router = Router();
    this.chapterController = chapterController;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * GET /api/chapters/:id
     * Get a single chapter by ID
     */
    this.router.get(
      "/chapters/:id",
      this.chapterController.getChapterById.bind(this.chapterController),
    );

    /**
     * GET /api/chapters/:id/with-lessons
     * Get chapter with lesson details
     */
    this.router.get(
      "/chapters/:id/with-lessons",
      this.chapterController.getChapterWithLessons.bind(this.chapterController),
    );

    /**
     * GET /api/courses/:courseId/chapters
     * Get all chapters for a course
     */
    this.router.get(
      "/courses/:courseId/chapters",
      this.chapterController.getChaptersByCourse.bind(this.chapterController),
    );

    /**
     * POST /api/chapters
     * Create a new chapter
     */
    this.router.post(
      "/chapters",
      authMiddleware,
      this.chapterController.createChapter.bind(this.chapterController),
    );

    /**
     * PATCH /api/chapters/:id
     * Update a chapter
     */
    this.router.patch(
      "/chapters/:id",
      authMiddleware,
      this.chapterController.updateChapter.bind(this.chapterController),
    );

    /**
     * DELETE /api/chapters/:id
     * Delete a chapter
     */
    this.router.delete(
      "/chapters/:id",
      authMiddleware,
      this.chapterController.deleteChapter.bind(this.chapterController),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
