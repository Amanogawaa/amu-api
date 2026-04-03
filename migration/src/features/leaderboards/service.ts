/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LeaderboardsRepository } from "./repository";
import type {
  LeaderboardFilters,
  LeaderboardEntry,
  StreakData,
  UpdateStreakRequest,
} from "./types";

export class LeaderboardsService {
  private leaderboardsRepository: LeaderboardsRepository;

  constructor(leaderboardsRepository: LeaderboardsRepository) {
    this.leaderboardsRepository = leaderboardsRepository;
  }

  async getLeaderboards(filters: LeaderboardFilters) {
    const leaderboardData =
      await this.leaderboardsRepository.getLeaderboards(filters);

    // Add rank to each entry
    const rankedData: LeaderboardEntry[] = leaderboardData.map(
      (entry, index) => ({
        ...entry,
        rank: index + 1,
      }),
    );

    return rankedData;
  }

  async getUserRank(userId: string, sortBy: string = "score") {
    return this.leaderboardsRepository.getUserRank(userId, sortBy);
  }

  async getUserStats(userId: string) {
    const stats = await this.leaderboardsRepository.getUserStats(userId);

    if (!stats) {
      // Return default stats for new users
      return {
        totalLessonsCompleted: 0,
        totalCoursesCompleted: 0,
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    return stats;
  }

  async updateUserActivity(request: UpdateStreakRequest) {
    const { userId, activityDate = new Date() } = request;

    const currentStats = await this.leaderboardsRepository.getUserStats(userId);

    const streakData = this.calculateStreak(currentStats, activityDate);

    await this.leaderboardsRepository.updateStreak(userId, streakData);

    return streakData;
  }

  async incrementLessonCompletion(userId: string, pointsEarned: number = 50) {
    const stats = await this.leaderboardsRepository.getUserStats(userId);

    const updatedStats = {
      totalLessonsCompleted: (stats?.totalLessonsCompleted || 0) + 1,
      totalPoints: (stats?.totalPoints || 0) + pointsEarned,
    };

    await this.leaderboardsRepository.updateUserStats(userId, updatedStats);

    // Also update streak
    await this.updateUserActivity({ userId });

    return updatedStats;
  }

  async incrementCourseCompletion(userId: string, pointsEarned: number = 150) {
    const stats = await this.leaderboardsRepository.getUserStats(userId);

    const updatedStats = {
      totalCoursesCompleted: (stats?.totalCoursesCompleted || 0) + 1,
      totalPoints: (stats?.totalPoints || 0) + pointsEarned,
    };

    await this.leaderboardsRepository.updateUserStats(userId, updatedStats);

    return updatedStats;
  }

  private calculateStreak(currentStats: any, activityDate: Date): StreakData {
    const now = new Date(activityDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let currentStreak = currentStats?.currentStreak || 0;
    let longestStreak = currentStats?.longestStreak || 0;
    let streakStartDate = currentStats?.streakStartDate || today;

    const lastActive = currentStats?.lastActiveAt
      ? new Date(currentStats.lastActiveAt)
      : null;

    if (lastActive) {
      const lastActiveDate = new Date(
        lastActive.getFullYear(),
        lastActive.getMonth(),
        lastActive.getDate(),
      );

      const daysDiff = Math.floor(
        (today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === 0) {
        // Same day, no change to streak
        return {
          currentStreak,
          longestStreak,
          lastActiveAt: now,
          streakStartDate: new Date(streakStartDate),
        };
      } else if (daysDiff === 1) {
        // Consecutive day
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        // Streak broken
        currentStreak = 1;
        streakStartDate = today;
      }
    } else {
      // First activity
      currentStreak = 1;
      longestStreak = 1;
      streakStartDate = today;
    }

    return {
      currentStreak,
      longestStreak,
      lastActiveAt: now,
      streakStartDate: new Date(streakStartDate),
    };
  }

  async getLeaderboardStats() {
    return this.leaderboardsRepository.calculateTotalStats();
  }
}
