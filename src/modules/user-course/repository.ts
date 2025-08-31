import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../../core/utils/errors';
import { logger } from '../../core/utils/loggers';

export class UserCourseRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async enrollUser(userId: string, courseId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('user_courses')
        .insert({
          user_id: userId,
          course_id: courseId,
        })
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new AppError('User is already enrolled in this course', 409);
        }
        logger.error('Error enrolling user:', error);
        throw new AppError(`Failed to enroll: ${error.message}`, 500);
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(
        'Unexpected error in UserCourseRepository enrollUser:',
        error
      );
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async markLessonCompleted(
    userId: string,
    lessonId: string,
    score?: number
  ): Promise<any> {
    try {
      const updateData: any = {
        user_id: userId,
        lesson_id: lessonId,
        completed_at: new Date().toISOString(),
      };
      if (score !== undefined) updateData.score = score;

      const { data, error } = await this.supabase
        .from('user_lesson_progress')
        .upsert(updateData)
        .select('*')
        .single();

      if (error) {
        logger.error('Error marking lesson completed:', error);
        throw new AppError(
          `Failed to mark lesson completed: ${error.message}`,
          500
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(
        'Unexpected error in UserCourseRepository markLessonCompleted:',
        error
      );
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async getCourseIdFromLesson(lessonId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('lessons')
        .select('chapter_id (course_id)')
        .eq('id', lessonId)
        .single();

      if (error || !data) {
        logger.error('Error fetching course ID from lesson:', error);
        throw new AppError('Lesson not found', 404);
      }

      return data.chapter_id.course_id;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(
        'Unexpected error in UserCourseRepository getCourseIdFromLesson:',
        error
      );
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async getCompletedLessonsCountForCourse(
    userId: string,
    courseId: string
  ): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('user_lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .in('lesson_id', [
          this.supabase
            .from('lessons')
            .select('id')
            .in('chapter_id', [
              this.supabase
                .from('chapters')
                .select('id')
                .eq('course_id', courseId),
            ]),
        ]);

      if (error) {
        logger.error('Error counting completed lessons:', error);
        throw new AppError(
          `Failed to count completed lessons: ${error.message}`,
          500
        );
      }

      return count || 0;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(
        'Unexpected error in UserCourseRepository getCompletedLessonsCountForCourse:',
        error
      );
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async getTotalLessonsCountForCourse(courseId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .in('chapter_id', [
          this.supabase.from('chapters').select('id').eq('course_id', courseId),
        ]);

      if (error) {
        logger.error('Error counting total lessons:', error);
        throw new AppError(
          `Failed to count total lessons: ${error.message}`,
          500
        );
      }

      return count || 0;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(
        'Unexpected error in UserCourseRepository getTotalLessonsCountForCourse:',
        error
      );
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async updateCourseProgress(
    userId: string,
    courseId: string,
    progress: number,
    completedAt?: string
  ): Promise<any> {
    try {
      const updateData: any = { progress };
      if (completedAt) updateData.completed_at = completedAt;

      const { data, error } = await this.supabase
        .from('user_courses')
        .update(updateData)
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .select('*')
        .single();

      if (error) {
        logger.error('Error updating course progress:', error);
        throw new AppError(
          `Failed to update course progress: ${error.message}`,
          500
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(
        'Unexpected error in UserCourseRepository updateCourseProgress:',
        error
      );
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async getUserCourseProgress(userId: string, courseId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (error) {
        logger.error('Error fetching user course progress:', error);
        throw new AppError(`Failed to fetch progress: ${error.message}`, 500);
      }

      if (!data) {
        throw new AppError('Enrollment not found', 404);
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(
        'Unexpected error in UserCourseRepository getUserCourseProgress:',
        error
      );
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }
}
