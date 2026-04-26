import { Router } from "express";
import {
  basicHealthCheck,
  detailedHealthCheck,
  livenessCheck,
  readinessCheck,
} from "./core/utils/health";
import { AuthContainer } from "./modules/auth/container";
import type { CapstoneContainer } from "./modules/capstone/container";
import type { ChapterContainer } from "./modules/chapter/container";
import type { CodePlaygroundContainer } from "./modules/code-playground/container";
import type { CommentsContainer } from "./modules/comments/container";
import { CourseContainer } from "./modules/course/container";
import type { EnrollmentContainer } from "./modules/enrollment/container";
import type { GitHubContainer } from "./modules/github/container";
import type { LeaderboardsContainer } from "./modules/leaderboards/container";
import type { LessonAssistantContainer } from "./modules/lesson-assistant/container";
import type { LessonContainer } from "./modules/lesson/container";
import type { LikesContainer } from "./modules/likes/container";
import type { ProgressContainer } from "./modules/progress/container";
import type { RecommendationContainer } from "./modules/recommendation/container";
import socketTestRoutes from "./modules/socket/route";
import type { UserContainer } from "./modules/user/container";

export class AppRoutes {
  private router: Router;
  private authContainer: AuthContainer;
  private courseContainer: CourseContainer;
  private chapterContainer: ChapterContainer;
  private lessonContainer: LessonContainer;
  private progressContainer: ProgressContainer;
  private likesContainer: LikesContainer;
  private commentsContainer: CommentsContainer;
  private userContainer: UserContainer;
  private enrollmentContainer: EnrollmentContainer;
  private codePlaygroundContainer: CodePlaygroundContainer;
  private capstoneContainer: CapstoneContainer;
  private githubContainer: GitHubContainer;
  private lessonAssistantContainer: LessonAssistantContainer;
  private recommendationContainer: RecommendationContainer;
  private leaderboardsContainer: LeaderboardsContainer;

  constructor(
    authContainer: AuthContainer,
    courseContainer: CourseContainer,
    chapterContainer: ChapterContainer,
    lessonContainer: LessonContainer,
    progressContainer: ProgressContainer,
    likesContainer: LikesContainer,
    commentsContainer: CommentsContainer,
    userContainer: UserContainer,
    enrollmentContainer: EnrollmentContainer,
    codePlaygroundContainer: CodePlaygroundContainer,
    capstoneContainer: CapstoneContainer,
    githubContainer: GitHubContainer,
    lessonAssistantContainer: LessonAssistantContainer,
    recommendationContainer: RecommendationContainer,
    leaderboardsContainer: LeaderboardsContainer,
  ) {
    this.router = Router();
    this.authContainer = authContainer;
    this.courseContainer = courseContainer;
    this.chapterContainer = chapterContainer;
    this.lessonContainer = lessonContainer;
    this.progressContainer = progressContainer;
    this.likesContainer = likesContainer;
    this.commentsContainer = commentsContainer;
    this.userContainer = userContainer;
    this.enrollmentContainer = enrollmentContainer;
    this.codePlaygroundContainer = codePlaygroundContainer;
    this.capstoneContainer = capstoneContainer;
    this.githubContainer = githubContainer;
    this.lessonAssistantContainer = lessonAssistantContainer;
    this.recommendationContainer = recommendationContainer;
    this.leaderboardsContainer = leaderboardsContainer;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/health", basicHealthCheck);
    this.router.get("/health/detailed", detailedHealthCheck);
    this.router.get("/health/ready", readinessCheck);
    this.router.get("/health/live", livenessCheck);

    this.router.use("/", this.authContainer.getRouter());
    this.router.use("/", this.courseContainer.getRouter());
    this.router.use("/", this.chapterContainer.getRouter());
    this.router.use("/", this.lessonContainer.getRouter());
    this.router.use("/", this.progressContainer.getRouter());
    this.router.use("/", this.likesContainer.getRouter());
    this.router.use("/", this.commentsContainer.getRouter());
    this.router.use("/socket", socketTestRoutes);
    this.router.use("/", this.userContainer.getRouter());
    this.router.use("/", this.enrollmentContainer.route.getRouter());
    this.router.use("/", this.codePlaygroundContainer.getRouter());
    this.router.use("/", this.capstoneContainer.getRouter());
    this.router.use("/", this.githubContainer.getRouter());
    this.router.use("/", this.lessonAssistantContainer.getRouter());
    this.router.use("/", this.recommendationContainer.getRouter());
    this.router.use("/", this.leaderboardsContainer.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
