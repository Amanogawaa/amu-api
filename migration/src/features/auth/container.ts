import { AuthController } from "./controller";
import { AuthRepository } from "./repository";
import { AuthRoute } from "./route";
import { AuthService } from "./service";
import admin from "firebase-admin";

export class AuthContainer {
  public readonly repository: AuthRepository;
  public readonly service: AuthService;
  public readonly controller: AuthController;
  public readonly routes: AuthRoute;

  constructor(firebaseAuth: admin.auth.Auth = admin.auth()) {
    this.repository = new AuthRepository(firebaseAuth);
    this.service = new AuthService(this.repository);
    this.controller = new AuthController(this.service);
    this.routes = new AuthRoute(this.controller);
  }
}
