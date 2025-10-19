import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import type { AuthContainer } from "./features/auth/container";

export class AppRoutes {
  private router: Router;
  private authContainer: AuthContainer;

  constructor(authContainer: AuthContainer) {
    this.router = Router();
    this.authContainer = authContainer;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use("/amu", this.authContainer.getRouter());

    this.router.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: err.message });
      }
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
