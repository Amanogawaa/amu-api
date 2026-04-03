import { AuthController } from "./controller";
import { AuthRoutes } from "./route";
import { AuthService } from "./service";

export class AuthContainer {
  public authService: AuthService;
  public authController: AuthController;
  public routes: AuthRoutes;

  constructor() {
    this.authService = new AuthService();
    this.authController = new AuthController(this.authService);
    this.routes = new AuthRoutes(this.authController);
  }

  getRouter() {
    return this.routes.router;
  }
}
