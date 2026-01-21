import type { LeaderboardsRepository } from "./repository";

export class LeaderboardsService {
  private leaderboardsRepository: LeaderboardsRepository;

  constructor(leaderboardsRepository: LeaderboardsRepository) {
    this.leaderboardsRepository = leaderboardsRepository;
  }

  async getLeaderboards() {
    return this.leaderboardsRepository.getLeaderboards();
  }
}
