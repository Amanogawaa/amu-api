import { CapstoneController } from './controller';
import { CapstoneRepository } from './repository';
import { CapstoneRoute } from './route';
import { CapstoneService } from './service';
import { GitHubService } from '../github/service';
import { firebaseFirestore } from '../../config/firebase';
import type { Firestore } from 'firebase-admin/firestore';

export class CapstoneContainer {
  public readonly repository: CapstoneRepository;
  public readonly githubService: GitHubService;
  public readonly service: CapstoneService;
  public readonly controller: CapstoneController;
  public readonly routes: CapstoneRoute;

  constructor(firestore: Firestore = firebaseFirestore) {
    this.repository = new CapstoneRepository(firestore);
    this.githubService = new GitHubService();
    this.service = new CapstoneService(this.repository, this.githubService);
    this.controller = new CapstoneController(this.service);
    this.routes = new CapstoneRoute(this.controller);
  }

  getRouter() {
    return this.routes.getRouter();
  }
}
