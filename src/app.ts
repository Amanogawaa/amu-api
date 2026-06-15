import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Application, NextFunction, Request, Response } from "express";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import http from "http";
import path from "path";
import type { Server as SocketIOServer } from "socket.io";
import swaggerUi from "swagger-ui-express";
import { initializeSocketIO } from "./config/socket";
import { swaggerSpec } from "./config/swagger";
import { performanceMonitor } from "./middlewares/performance.middleware";
import { socketAuthMiddleware } from "./middlewares/socket.middleware";
import { logger } from "./utils/loggers";
import { SocketHandlers } from "./utils/socket/socket.handlers";

import { config } from "./config/environment";
import { AuthContainer } from "./features/auth/container";
import { CapstoneContainer } from "./features/capstone/container";
import { ChapterContainer } from "./features/chapter/container";
import { CodePlaygroundContainer } from "./features/code-playground/container";
import { CommentsContainer } from "./features/comments/container";
import { CourseContainer } from "./features/course/container";
import { EnrollmentContainer } from "./features/enrollment/container";
import { GitHubContainer } from "./features/github/container";
import { LeaderboardsContainer } from "./features/leaderboards/container";
import { LessonAssistantContainer } from "./features/lesson-assistant/container";
import { LessonContainer } from "./features/lesson/container";
import { LikesContainer } from "./features/likes/container";
import { ProgressContainer } from "./features/progress/container";
import { RecommendationContainer } from "./features/recommendation/container";
import { UserContainer } from "./features/user/container";
import { cacheMiddleware } from "./middlewares/cache.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { AppRoutes } from "./routes";
import { QuizContainer } from "@features/quiz/container";
import { AppAssistantContainer } from "./features/app-assistant/container";

class App {
  public app: Application;
  public server: http.Server;
  public io: SocketIOServer;
  public socketHandlers: SocketHandlers;

  private appRoutes!: AppRoutes;
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
  private quizContainer: QuizContainer;
  private appAssistantContainer: AppAssistantContainer;

  constructor(
    authContainer: AuthContainer = new AuthContainer(),
    chapterContainer: ChapterContainer = new ChapterContainer(),
    lessonContainer?: LessonContainer,
    courseContainer?: CourseContainer,
    progressContainer: ProgressContainer = new ProgressContainer(),
    likesContainer: LikesContainer = new LikesContainer(),
    commentsContainer: CommentsContainer = new CommentsContainer(),
    userContainer: UserContainer = new UserContainer(),
    codePlaygroundContainer?: CodePlaygroundContainer,
    quizContainer: QuizContainer = new QuizContainer(),
  ) {
    this.app = express();
    this.server = http.createServer(this.app);

    this.io = initializeSocketIO(this.server);
    this.io.use(socketAuthMiddleware);
    this.socketHandlers = new SocketHandlers(this.io);
    this.socketHandlers.registerHandlers();

    this.authContainer = authContainer;
    this.chapterContainer = chapterContainer;

    this.quizContainer = quizContainer;

    this.lessonContainer =
      lessonContainer || new LessonContainer(undefined, quizContainer.service);

    this.courseContainer =
      courseContainer ||
      new CourseContainer(
        undefined,
        chapterContainer.service,
        this.lessonContainer.service,
      );

    this.codePlaygroundContainer =
      codePlaygroundContainer ||
      new CodePlaygroundContainer(
        this.courseContainer.repository,
        chapterContainer.repository,
        this.lessonContainer.repository,
      );

    this.lessonContainer.service.setCodePlaygroundService(
      this.codePlaygroundContainer.service
    );

    this.capstoneContainer = new CapstoneContainer(
      undefined,
      this.courseContainer.repository,
      chapterContainer.repository,
      this.lessonContainer.repository,
    );

    this.githubContainer = new GitHubContainer();

    this.lessonAssistantContainer = new LessonAssistantContainer(
      this.lessonContainer.repository,
    );

    this.recommendationContainer = new RecommendationContainer();

    this.leaderboardsContainer = new LeaderboardsContainer();
    
    this.appAssistantContainer = new AppAssistantContainer();

    this.progressContainer =
      progressContainer ||
      new ProgressContainer(
        undefined,
        this.lessonContainer.service,
        this.leaderboardsContainer.leaderboardsService,
      );
    this.likesContainer = likesContainer;
    this.commentsContainer = commentsContainer;
    this.userContainer = userContainer;

    this.enrollmentContainer = new EnrollmentContainer(
      this.courseContainer.repository,
      this.progressContainer.repository,
    );

    this.app.use(
      compression({
        filter: (req: Request, res: Response) => {
          if (req.headers["x-no-compression"]) {
            return false;
          }
          return compression.filter(req, res);
        },
        level: 6,
        threshold: 1024,
      }),
    );

    this.app.use(
      express.json({
        limit: "10mb",
      }),
    );

    this.app.use(
      express.urlencoded({
        extended: true,
        limit: "10mb",
        parameterLimit: 1000,
      }),
    );

    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", ...config.security.corsOrigins],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        frameguard: { action: "deny" },
        noSniff: true,
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      }),
    );

    if (config.env === "production") {
      this.app.use((req, res, next) => {
        // Skip HTTPS redirect for health check endpoints
        if (req.path === "/health" || req.path === "/api/health") {
          return next();
        }

        if (req.secure || req.headers["x-forwarded-proto"] === "https") {
          return next();
        }
        res.redirect(301, `https://${req.headers.host}${req.url}`);
      });
    }

    const corsOptions = {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        if (!origin) return callback(null, true);

        if (config.security.corsOrigins.includes("*")) {
          return callback(null, true);
        }

        if (config.security.corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: "GET,POST,PATCH,PUT,DELETE,OPTIONS",
      credentials: true,
      optionsSuccessStatus: 200,
    };

    this.app.use(cors(corsOptions));
    this.app.use(cookieParser(config.security.cookieSecret));
    this.app.use(performanceMonitor);
    this.app.use(cacheMiddleware);

    const apiLimiter = rateLimit({
      windowMs: config.security.rateLimitWindowMs,
      max: config.security.rateLimitMaxRequests,
      message: {
        error: {
          message: "Too many requests from this IP, please try again later",
          code: "RATE_LIMIT_EXCEEDED",
        },
        status: "error",
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === "/health",
    });

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      skipSuccessfulRequests: true,
      message: {
        error: {
          message: "Too many authentication attempts, please try again later",
          code: "AUTH_RATE_LIMIT_EXCEEDED",
        },
        status: "error",
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use("/api/", apiLimiter);
    this.app.use("/api/auth/", authLimiter);

    this.app.use(
      "/uploads",
      express.static(path.join(process.cwd(), "uploads"), {
        maxAge: "1d",
        etag: true,
        lastModified: true,
      }),
    );

    this.app.get("/health", (req, res) => {
      res
        .status(200)
        .json({ status: "ok", timestamp: new Date().toISOString() });
    });

    this.initializeMiddleware();
    this.initializeRouter();

    this.app.use(errorHandler);
  }

  private initializeRouter(): void {
    this.appRoutes = new AppRoutes(
      this.authContainer,
      this.courseContainer,
      this.chapterContainer,
      this.lessonContainer,
      this.progressContainer,
      this.likesContainer,
      this.commentsContainer,
      this.userContainer,
      this.enrollmentContainer,
      this.codePlaygroundContainer,
      this.capstoneContainer,
      this.githubContainer,
      this.lessonAssistantContainer,
      this.recommendationContainer,
      this.leaderboardsContainer,
      this.quizContainer,
      this.appAssistantContainer
    );

    this.app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    this.app.use("/api", this.appRoutes.getRouter());

    this.app.locals.io = this.io;
    this.app.locals.socketHandlers = this.socketHandlers;
  }

  private initializeMiddleware(): void {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      logger.info("Incoming request", {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.on("finish", () => {
        const duration = Date.now() - start;
        const isSlowRequest = duration > 1000;

        const logData = {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
        };

        if (isSlowRequest) {
          logger.warn("Slow request detected", logData);
        } else {
          logger.info("Request completed", logData);
        }
      });

      next();
    });
  }

  public async start(port: number = 8080): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(port, () => {
        logger.info(`Server running on http://localhost:${port}`);
        resolve();
      });
      this.server.on("error", (error) => {
        logger.error("Server failed to start:", error);
        reject(error);
      });
    });
  }
}

export default new App();
