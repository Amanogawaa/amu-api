export interface LeaderboardEntry {
  userId: string;
  userName: string;
  photoURL?: string;
  score: number;
  rank: number;
  lessonsCompleted: number;
  coursesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveAt?: Date;
}

export interface LeaderboardFilters {
  limit?: number;
  period?: "all-time" | "monthly" | "weekly";
  sortBy?: "score" | "lessons" | "courses" | "streak";
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  message: string;
  total: number;
  userRank?: number;
  currentPage?: number;
  totalPages?: number;
}

export interface UserStats {
  totalLessonsCompleted: number;
  totalCoursesCompleted: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveAt?: Date;
  streakStartDate?: Date;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveAt: Date;
  streakStartDate: Date;
}

export interface UpdateStreakRequest {
  userId: string;
  activityDate?: Date;
}
