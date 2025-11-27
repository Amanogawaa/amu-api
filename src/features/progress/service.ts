import { AppError } from '../../utils/errors';
import type { ProgressRepository } from './repository';
import type {
  ProgressSummary,
  ProgressUpdateRequest,
  UserProgress,
} from './types';
import { firebaseFirestore } from '../../config/firebase';
import { logger } from '../../utils/loggers';
import type { QuizService } from '../quiz/service';
import type { LessonService } from '../lesson/service';

export class ProgressService {
  constructor(
    private repository: ProgressRepository,
    private quizService?: QuizService,
    private lessonService?: LessonService
  ) {}

  /**
   * Validate that user has passed the quiz if lesson is a quiz type
   */
  private async validateQuizCompletion(
    userId: string,
    lessonId: string
  ): Promise<void> {
    // If services are not available, skip validation (for backward compatibility)
    if (!this.lessonService || !this.quizService) {
      logger.warn(
        'Quiz and Lesson services not available, skipping quiz validation'
      );
      return;
    }

    try {
      // Get lesson to check its type
      const lesson = await this.lessonService.getLessonById(lessonId);
      
      // If lesson doesn't exist or is not a quiz type, no validation needed
      if (!lesson || lesson.type !== 'quiz') {
        return;
      }

      // Check if quiz exists for this lesson
      const quiz = await this.quizService.getQuiz(lessonId);
      if (!quiz) {
        // If no quiz exists yet, allow completion (quiz might be generated later)
        logger.info(`No quiz found for lesson ${lessonId}, allowing completion`);
        return;
      }

      // Get user's attempts for this quiz
      const attempts = await this.quizService.getUserAttempts(userId, quiz.id);
      
      // Check if user has at least one passed attempt
      const hasPassed = attempts.some((attempt) => attempt.passed);
      
      if (!hasPassed) {
        throw new AppError(
          'You must pass the quiz before marking this lesson as complete',
          403
        );
      }

      logger.info(
        `Quiz validation passed for user ${userId} on lesson ${lessonId}`
      );
    } catch (error) {
      // If it's an AppError, re-throw it
      if (error instanceof AppError) {
        throw error;
      }
      // For other errors, log and allow (fail open for backward compatibility)
      logger.error('Error validating quiz completion:', error);
    }
  }

  /**
   * Check if user is enrolled in a course or is the course owner
   */
  private async checkEnrollmentOrOwnership(
    courseId: string,
    userId: string
  ): Promise<void> {
    try {
      // Check if user is the course owner
      const courseDoc = await firebaseFirestore
        .collection('courses')
        .doc(courseId)
        .get();

      if (!courseDoc.exists) {
        throw new AppError('Course not found', 404);
      }

      const courseData = courseDoc.data();

      // If user owns the course, they can track progress
      if (courseData?.uid === userId) {
        return;
      }

      // Otherwise, check enrollment
      const enrollmentId = `${courseId}_${userId}`;
      const enrollmentDoc = await firebaseFirestore
        .collection('enrollments')
        .doc(enrollmentId)
        .get();

      if (!enrollmentDoc.exists) {
        throw new AppError(
          'You must enroll in this course before tracking progress',
          403
        );
      }

      const enrollmentData = enrollmentDoc.data();

      if (enrollmentData?.status !== 'active') {
        throw new AppError('Your enrollment in this course is not active', 403);
      }
    } catch (error) {
      logger.error('Error checking enrollment or ownership:', error);
      throw error;
    }
  }

  async markLessonProgress(
    userId: string,
    data: ProgressUpdateRequest
  ): Promise<UserProgress> {
    const {
      courseId,
      lessonId,
      completed,
      totalLessons: newTotalLessons,
    } = data;

    // Check enrollment or ownership before allowing progress tracking
    await this.checkEnrollmentOrOwnership(courseId, userId);

    // If marking as complete, validate quiz requirement
    if (completed) {
      await this.validateQuizCompletion(userId, lessonId);
    }

    // Get existing progress or create new
    let progress = await this.repository.getProgressByCourse(courseId, userId);

    if (!progress) {
      // Initialize progress for this user/course
      progress = await this.repository.createProgress({
        courseId,
        userId,
        lessonsCompleted: completed ? [lessonId] : [],
        totalLessons: newTotalLessons || 0, // Use provided or default to 0
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

      // Update totalLessons if provided
      const totalLessons =
        newTotalLessons !== undefined
          ? newTotalLessons
          : progress.totalLessons || 1;

      // Calculate percentage
      const percentComplete =
        totalLessons > 0
          ? Math.round((lessonsCompleted.length / totalLessons) * 100)
          : 0;

      const updates: Partial<UserProgress> = {
        lessonsCompleted,
        percentComplete,
      };

      // Only update totalLessons if a new value was provided
      if (newTotalLessons !== undefined) {
        updates.totalLessons = newTotalLessons;
      }

      progress = await this.repository.updateProgress(
        courseId,
        userId,
        updates
      );
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
