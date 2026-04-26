import { firebaseFirestore } from "@config/firebase";
import type { Firestore } from "firebase-admin/firestore";
import type { LeaderboardFilters, StreakData, UserStats } from "./types";

export class LeaderboardsRepository {
  private firebaseStore: Firestore;
  private readonly USER_STATS_COLLECTION = "userStats";
  private readonly USERS_COLLECTION = "users";
  private readonly PROGRESS_COLLECTION = "userProgress";

  constructor(firebaseStore: Firestore = firebaseFirestore) {
    this.firebaseStore = firebaseStore;
  }

  async getUserStats(userId: string): Promise<UserStats | null> {
    const doc = await this.firebaseStore
      .collection(this.USER_STATS_COLLECTION)
      .doc(userId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as UserStats;
  }

  async updateUserStats(
    userId: string,
    stats: Partial<UserStats>,
  ): Promise<void> {
    const docRef = this.firebaseStore
      .collection(this.USER_STATS_COLLECTION)
      .doc(userId);

    const doc = await docRef.get();

    if (doc.exists) {
      await docRef.update({
        ...stats,
        updatedAt: new Date(),
      });
    } else {
      await docRef.set({
        totalLessonsCompleted: 0,
        totalCoursesCompleted: 0,
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        ...stats,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async getLeaderboards(filters: LeaderboardFilters) {
    const { limit = 100, sortBy = "score" } = filters;

    const sortField = this.getSortField(sortBy);

    let query = this.firebaseStore
      .collection(this.USER_STATS_COLLECTION)
      .orderBy(sortField, "desc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    const leaderboardData = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const userId = doc.id;
        const stats = doc.data() as UserStats;

        const userDoc = await this.firebaseStore
          .collection(this.USERS_COLLECTION)
          .doc(userId)
          .get();

        const userData = userDoc.data();

        return {
          userId,
          userName:
            userData?.firstName && userData?.lastName
              ? `${userData.firstName} ${userData.lastName}`
              : userData?.email?.split("@")[0] || "Anonymous",
          photoURL: userData?.photoURL,
          score: stats.totalPoints || 0,
          lessonsCompleted: stats.totalLessonsCompleted || 0,
          coursesCompleted: stats.totalCoursesCompleted || 0,
          currentStreak: stats.currentStreak || 0,
          longestStreak: stats.longestStreak || 0,
          lastActiveAt: stats.lastActiveAt,
        };
      }),
    );

    return leaderboardData;
  }

  async getUserRank(userId: string, sortBy: string = "score"): Promise<number> {
    const userStats = await this.getUserStats(userId);
    if (!userStats) return -1;

    const sortField = this.getSortField(sortBy);
    const userValue = this.getUserValue(userStats, sortBy);

    const snapshot = await this.firebaseStore
      .collection(this.USER_STATS_COLLECTION)
      .where(sortField, ">", userValue)
      .get();

    return snapshot.size + 1;
  }

  async updateStreak(userId: string, streakData: StreakData): Promise<void> {
    await this.updateUserStats(userId, {
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      lastActiveAt: streakData.lastActiveAt,
      streakStartDate: streakData.streakStartDate,
    });
  }

  async calculateTotalStats(): Promise<{
    totalUsers: number;
    totalLessonsCompleted: number;
    totalCoursesCompleted: number;
  }> {
    const snapshot = await this.firebaseStore
      .collection(this.USER_STATS_COLLECTION)
      .get();

    let totalLessons = 0;
    let totalCourses = 0;

    snapshot.docs.forEach((doc) => {
      const stats = doc.data() as UserStats;
      totalLessons += stats.totalLessonsCompleted || 0;
      totalCourses += stats.totalCoursesCompleted || 0;
    });

    return {
      totalUsers: snapshot.size,
      totalLessonsCompleted: totalLessons,
      totalCoursesCompleted: totalCourses,
    };
  }

  private getSortField(sortBy: string): string {
    switch (sortBy) {
      case "lessons":
        return "totalLessonsCompleted";
      case "courses":
        return "totalCoursesCompleted";
      case "streak":
        return "currentStreak";
      case "score":
      default:
        return "totalPoints";
    }
  }

  private getUserValue(stats: UserStats, sortBy: string): number {
    switch (sortBy) {
      case "lessons":
        return stats.totalLessonsCompleted || 0;
      case "courses":
        return stats.totalCoursesCompleted || 0;
      case "streak":
        return stats.currentStreak || 0;
      case "score":
      default:
        return stats.totalPoints || 0;
    }
  }
}
