export interface UserProgress {
  id: string; // composite: `${courseId}_${userId}`
  courseId: string;
  userId: string;
  lessonsCompleted: string[]; // array of lessonIds
  totalLessons: number; // denormalized for quick calc
  percentComplete: number;
  lastActivityAt: Date;
  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
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
