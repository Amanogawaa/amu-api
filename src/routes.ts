import { Router } from "express";
import { AuthContainer } from "./features/auth/container";
import type { ChapterContainer } from "./features/chapter/container";
import type { CodePlaygroundContainer } from "./features/code-playground/container";
import type { CommentsContainer } from "./features/comments/container";
import { CourseContainer } from "./features/course/container";
import type { EnrollmentContainer } from "./features/enrollment/container";
import type { LessonContainer } from "./features/lesson/container";
import type { LikesContainer } from "./features/likes/container";
import type { ProgressContainer } from "./features/progress/container";
import type { QuizContainer } from "./features/quiz/container";
import socketTestRoutes from "./features/socket/route";
import type { UserContainer } from "./features/user/container";
import type { CapstoneContainer } from "./features/capstone/container";
import type { GitHubContainer } from "./features/github/container";
import type { LessonAssistantContainer } from "./features/lesson-assistant/container";
import type { RecommendationContainer } from "./features/recommendation/container";
import type { LeaderboardsContainer } from "./features/leaderboards/container";
import {
  basicHealthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck,
} from "./utils/health";

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
  private quizContainer: QuizContainer;
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
    quizContainer: QuizContainer,
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
    this.quizContainer = quizContainer;
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
    this.router.use("/", this.quizContainer.getRouter());
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
