import express, { type Application } from "express";
import { type Request, type Response } from "express";

import http from "http";
import { logger } from "./core/utils/loggers";
import { AppRoutes } from "./routes";
import { CourseContainer } from "./modules/course/container";

class App {
  public app: Application;
  public server: http.Server;

  private appRoutes!: AppRoutes;
  private courseContainer: CourseContainer;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.courseContainer = new CourseContainer();

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.initializeMiddleware();
    this.initializeRouter();
  }

  private initializeRouter(): void {
    this.appRoutes = new AppRoutes(this.courseContainer);
    this.app.use("/api", this.appRoutes.getRouter()); // Add this line
  }

  private initializeMiddleware(): void {
    this.app.use((req: Request, res: Response, next: Function) => {
      logger.info("Incoming request", {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      next();
    });
  }

  public async start(port = 8080): Promise<void> {
    try {
      this.server.listen(port, () => {
        logger.info(`Server running on http://localhost:${port}`);
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export default new App();
