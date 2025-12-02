export interface UpdateUserProfile {
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  githubUsername?: string;
  githubId?: string;
  githubConnectedAt?: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  status: string;
  githubUsername?: string;
  githubId?: string;
  githubConnectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  data: UserProfile;
  message: string;
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  likesCount: number;
  enrollmentsCount: number;
  commentsCount: number;
  createdAt: Date;
}

export interface UserAnalytics {
  totalCoursesCreated: number;
  totalLikesReceived: number;
  totalEnrollments: number;
  totalComments: number;
  courses: CourseAnalytics[];
}
