import { GitHubService } from "./service";
import { GitHubController } from "./controller";
import { GitHubRoute } from "./route";

export class GitHubContainer {
  private service: GitHubService;
  private controller: GitHubController;
  private route: GitHubRoute;

  constructor() {
    this.service = new GitHubService();
    this.controller = new GitHubController(this.service);
    this.route = new GitHubRoute(this.controller);
  }

  getRouter() {
    return this.route.getRouter();
  }
}
