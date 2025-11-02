import { AppError } from '../../utils/errors';
import type { ProgressRepository } from './repository';
import type {
  ProgressSummary,
  ProgressUpdateRequest,
  UserProgress,
} from './types';

export class ProgressService {
  constructor(private repository: ProgressRepository) {}

  async markLessonProgress(
    userId: string,
    data: ProgressUpdateRequest
  ): Promise<UserProgress> {
    const { courseId, lessonId, completed } = data;

    // Get existing progress or create new
    let progress = await this.repository.getProgressByCourse(courseId, userId);

    if (!progress) {
      // Initialize progress for this user/course
      progress = await this.repository.createProgress({
        courseId,
        userId,
        lessonsCompleted: completed ? [lessonId] : [],
        totalLessons: 0, // Will be updated when we fetch course structure
        percentComplete: 0,
        lastActivityAt: new Date(),
        enrolledAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // Update existing progress
      const lessonsCompleted = [...progress.lessonsCompleted];

      if (completed) {
        // Mark lesson as complete (add if not present)
        if (!lessonsCompleted.includes(lessonId)) {
          lessonsCompleted.push(lessonId);
        }
      } else {
        // Unmark lesson (remove if present)
        const index = lessonsCompleted.indexOf(lessonId);
        if (index > -1) {
          lessonsCompleted.splice(index, 1);
        }
      }

      // Calculate percentage
      const totalLessons = progress.totalLessons || 1; // Avoid division by zero
      const percentComplete = Math.round(
        (lessonsCompleted.length / totalLessons) * 100
      );

      progress = await this.repository.updateProgress(courseId, userId, {
        lessonsCompleted,
        percentComplete,
      });
    }

    return progress;
  }

  async getProgressForCourse(
    courseId: string,
    userId: string
  ): Promise<UserProgress | null> {
    return this.repository.getProgressByCourse(courseId, userId);
  }

  async getProgressForUser(userId: string): Promise<UserProgress[]> {
    return this.repository.getProgressByUser(userId);
  }

  async getProgressSummary(userId: string): Promise<ProgressSummary> {
    const allProgress = await this.repository.getProgressByUser(userId);

    const coursesInProgress = allProgress.filter(
      (p) => p.percentComplete > 0 && p.percentComplete < 100
    ).length;

    const coursesCompleted = allProgress.filter(
      (p) => p.percentComplete === 100
    ).length;

    const totalLessonsCompleted = allProgress.reduce(
      (sum, p) => sum + p.lessonsCompleted.length,
      0
    );

    // Note: We'd ideally fetch course names from the course service/repository
    // For now, just return IDs and let frontend resolve names
    const progressByCourseName = allProgress.map((p) => ({
      courseId: p.courseId,
      courseName: '', // TODO: Resolve from course service
      percentComplete: p.percentComplete,
      lessonsCompleted: p.lessonsCompleted.length,
      totalLessons: p.totalLessons,
    }));

    return {
      totalCourses: allProgress.length,
      coursesInProgress,
      coursesCompleted,
      totalLessonsCompleted,
      progressByCourseName,
    };
  }

  async updateTotalLessons(
    courseId: string,
    userId: string,
    totalLessons: number
  ): Promise<UserProgress> {
    const progress = await this.repository.getProgressByCourse(
      courseId,
      userId
    );

    if (!progress) {
      throw new AppError('Progress not found', 404);
    }

    const percentComplete = Math.round(
      (progress.lessonsCompleted.length / totalLessons) * 100
    );

    return this.repository.updateProgress(courseId, userId, {
      totalLessons,
      percentComplete,
    });
  }

  async deleteProgress(courseId: string, userId: string): Promise<void> {
    await this.repository.deleteProgress(courseId, userId);
  }

  async getCourseStatistics(courseId: string): Promise<{
    totalEnrolled: number;
    averageCompletion: number;
    completedCount: number;
  }> {
    const allProgress = await this.repository.getAllProgressForCourse(courseId);

    const totalEnrolled = allProgress.length;
    const completedCount = allProgress.filter(
      (p) => p.percentComplete === 100
    ).length;

    const averageCompletion =
      totalEnrolled > 0
        ? Math.round(
            allProgress.reduce((sum, p) => sum + p.percentComplete, 0) /
              totalEnrolled
          )
        : 0;

    return {
      totalEnrolled,
      averageCompletion,
      completedCount,
    };
  }
}
