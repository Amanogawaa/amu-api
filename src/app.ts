import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { Server as HttpServer } from "http";
import cors from "cors";
import helmet from "helmet";
import { AppRoute } from "./route";
import { AuthContainer } from "./modules/auth/container";
import { config } from "./config/environment";
import cookieParser from "cookie-parser";
import path from "path";
import { errorHandler } from "./core/middlewares/error.middleware";
import { CourseContainer } from "./modules/course";
import { ChapterContainer } from "./modules/chapter";
import { LessonContainer } from "./modules/lesson";

class App {
  public app: Application;
  public server: HttpServer | null;

  private appRoutes!: AppRoute;
  private authContainer: AuthContainer;
  private courseContainer: CourseContainer;
  private chapterContainer: ChapterContainer;
  private lessonContainer: LessonContainer;

  constructor(
    authContainer: AuthContainer = new AuthContainer(),
    courseContainer: CourseContainer = new CourseContainer(),
    chapterContainer: ChapterContainer = new ChapterContainer(),
    lessonContainer: LessonContainer = new LessonContainer(),
  ) {
    this.app = express();
    this.server = null;

    this.authContainer = authContainer;
    this.courseContainer = courseContainer;
    this.chapterContainer = chapterContainer;
    this.lessonContainer = lessonContainer;

    this.app.use(express.json());

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

    this.app.use(
      "/uploads",
      express.static(path.join(process.cwd(), "uploads"), {
        maxAge: "1d",
        etag: true,
        lastModified: true,
      }),
    );

    this.app.use(cors(corsOptions));
    this.app.use(cookieParser(config.security.cookieSecret));

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
    this.appRoutes = new AppRoute(
      this.authContainer,
      this.courseContainer,
      this.chapterContainer,
      this.lessonContainer,
    );
    this.app.use("/api", this.appRoutes.getRouter());
  }

  private initializeMiddleware(): void {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      console.info("Incoming request", {
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

        console.info(
          logData,
          isSlowRequest ? "Slow request detected" : "Request completed",
        );
      });

      next();
    });
  }

  public start(
    port: number = Number(process.env["PORT"] ?? 3000),
  ): Promise<HttpServer> {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(port, () => {
        this.server = server;
        console.log(`Server running on http://localhost:${port}`);
        resolve(server);
      });

      server.on("error", reject);
    });
  }
}

export default new App();
