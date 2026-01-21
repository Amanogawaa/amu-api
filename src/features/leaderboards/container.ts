import { firebaseFirestore } from "@config/firebase";
import { LeaderboardsController } from "./controller";
import { LeaderboardsRepository } from "./repository";
import { LeaderboardsRoute } from "./route";
import { LeaderboardsService } from "./service";

export class LeaderboardsContainer {
  public readonly leaderboardsService: LeaderboardsService;
  public readonly leaderboardsController: LeaderboardsController;
  public readonly leaderboardsRepository: LeaderboardsRepository;
  public readonly leaderboardsRoute: LeaderboardsRoute;

  constructor(firestore: FirebaseFirestore.Firestore = firebaseFirestore) {
    this.leaderboardsRepository = new LeaderboardsRepository(firestore);
    this.leaderboardsService = new LeaderboardsService(
      this.leaderboardsRepository,
    );
    this.leaderboardsController = new LeaderboardsController(
      this.leaderboardsService,
    );
    this.leaderboardsRoute = new LeaderboardsRoute(this.leaderboardsController);
  }

  getRouter() {
    return this.leaderboardsRoute.getRouter();
  }
}
