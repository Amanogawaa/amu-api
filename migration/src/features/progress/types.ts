export interface UserProgress {
  id: string;
  courseId: string;
  userId: string;
  lessonsCompleted: string[];
  totalLessons: number;
  percentComplete: number;
  lastActivityAt: Date;
  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressFilters {
  isPublished?: boolean;
  status?: string;
  minProgress?: number;
}

export interface ProgressUpdateRequest {
  courseId: string;
  lessonId: string;
  completed: boolean; // true to mark complete, false to unmark
  totalLessons?: number; // optional: update total lessons if provided
}

export interface ProgressResponse {
  data: UserProgress | UserProgress[] | ProgressSummary;
  message: string;
  total?: number;
}

export interface ProgressSummary {
  totalCourses: number;
  coursesInProgress: number;
  coursesCompleted: number;
  totalLessonsCompleted: number;
  progressByCourseName: Array<{
    courseId: string;
    courseName: string;
    percentComplete: number;
    lessonsCompleted: number;
    totalLessons: number;
  }>;
}

export interface GetProgressQuery {
  userId?: string;
  courseId?: string;
}
