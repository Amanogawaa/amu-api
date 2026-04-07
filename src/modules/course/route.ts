import { Router } from "express";
import { CourseController } from "./controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { courseOwnershipMiddleware } from "../../core/middlewares/ownership.middle";
import {
  validateCourseTopic,
  checkDuplicateCourse,
} from "../../core/middlewares/validator.middleware";
import { validateGenerateCourse } from "./validation";

export class CourseRoutes {
  public router: Router;
  private courseController: CourseController;

  constructor(courseController: CourseController) {
    this.router = Router();
    this.courseController = courseController;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * GET /api/courses
     * Get all courses with optional filtering
     */
    this.router.get(
      "/courses",
      this.courseController.getAllCourses.bind(this.courseController),
    );

    /**
     * GET /api/courses/user
     * Get courses created by authenticated user
     */
    this.router.get(
      "/courses/user",
      authMiddleware,
      this.courseController.getUserCourses.bind(this.courseController),
    );

    /**
     * POST /api/courses
     * Create a new course
     */
    this.router.post(
      "/courses",
      authMiddleware,
      this.courseController.createCourse.bind(this.courseController),
    );

    /**
     * GET /api/courses/:id
     * Get a single course by ID
     */
    this.router.get(
      "/courses/:id",
      this.courseController.getCourseById.bind(this.courseController),
    );

    /**
     * GET /api/courses/:id/details
     * Get course with details (chapters, enrollments, comments, likes)
     */
    this.router.get(
      "/courses/:id/details",
      authMiddleware,
      courseOwnershipMiddleware,
      this.courseController.getCourseWithDetails.bind(this.courseController),
    );

    /**
     * DELETE /api/courses/:id
     * Delete a course
     */
    this.router.delete(
      "/courses/:id",
      authMiddleware,
      courseOwnershipMiddleware,
      this.courseController.deleteCourse.bind(this.courseController),
    );

    this.router.post(
      "/courses/generate-sequential-transactional-streaming",
      authMiddleware,
      validateCourseTopic,
      checkDuplicateCourse,
      this.courseController.generateFullCourseSequentialTransactionalStreaming.bind(
        this.courseController,
      ),
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
