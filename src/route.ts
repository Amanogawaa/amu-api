import { Router } from "express";
import type { AuthContainer } from "./modules/auth/container";
import type { CourseContainer } from "./modules/course";
import { ChapterContainer } from "./modules/chapter";
import type { LessonContainer } from "./modules/lesson";

export class AppRoute {
  private router: Router;
  private authContainer: AuthContainer;
  private courseContainer: CourseContainer;
  private chapterContainer: ChapterContainer;
  private lessonContainer: LessonContainer;

  constructor(
    authContainer: AuthContainer,
    courseContainer: CourseContainer,
    chapterContainer: ChapterContainer,
    lessonContainer: LessonContainer,
  ) {
    this.router = Router();
    this.authContainer = authContainer;
    this.courseContainer = courseContainer;
    this.chapterContainer = chapterContainer;
    this.lessonContainer = lessonContainer;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok" });
    });

    this.router.use("/", this.authContainer.getRouter());
    this.router.use("/", this.courseContainer.getRouter());
    this.router.use("/", this.chapterContainer.getRouter());
    this.router.use("/", this.lessonContainer.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
