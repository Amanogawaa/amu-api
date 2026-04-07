import { Router } from "express";
import { LessonController } from "./controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";

export class LessonRoutes {
  public router: Router;
  private lessonController: LessonController;

  constructor(lessonController: LessonController) {
    this.router = Router();
    this.lessonController = lessonController;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * GET /api/lessons/:id
     * Get a single lesson by ID
     */
    this.router.get(
      "/lessons/:id",
      this.lessonController.getLessonById.bind(this.lessonController),
    );

    /**
     * GET /api/chapters/:chapterId/lessons
     * Get all lessons for a chapter
     */
    this.router.get(
      "/chapters/:chapterId/lessons",
      this.lessonController.getLessonsByChapter.bind(this.lessonController),
    );

    /**
     * GET /api/courses/:courseId/lessons
     * Get all lessons for a course
     */
    this.router.get(
      "/courses/:courseId/lessons",
      this.lessonController.getLessonsByCourse.bind(this.lessonController),
    );

    /**
     * POST /api/lessons
     * Create a new lesson
     */
    this.router.post(
      "/lessons",
      authMiddleware,
      this.lessonController.createLesson.bind(this.lessonController),
    );

    /**
     * PATCH /api/lessons/:id
     * Update a lesson
     */
    this.router.patch(
      "/lessons/:id",
      authMiddleware,
      this.lessonController.updateLesson.bind(this.lessonController),
    );

    /**
     * DELETE /api/lessons/:id
     * Delete a lesson
     */
    this.router.delete(
      "/lessons/:id",
      authMiddleware,
      this.lessonController.deleteLesson.bind(this.lessonController),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
