import { logger } from '../../core/utils/loggers';
import { AppError } from '../../core/utils/errors';
import { SupabaseClient } from '@supabase/supabase-js';
import { Chapter } from './types';

export class ChapterRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async createChapter(
    chapterData: Omit<Chapter, 'id' | 'created_at' | 'update_at'>[]
  ): Promise<Chapter[]> {
    try {
      const chapters = chapterData.map((chapter) => ({
        course_id: chapter.courseId,
        title: chapter.title,
        description: chapter.description,
        estimated_duration: chapter.estimatedDuration,
        order: chapter.order,
      }));
      const { data, error } = await this.supabase
        .from('chapters')
        .insert(chapters)
        .select('*');

      if (error) {
        logger.error('Error creating chapters:', error);
        throw new AppError(`Failed to create chapters: ${error.message}`, 500);
      }

      // Convert back to camelCase for application use
      const processedData = (data || []).map((chapter) => ({
        ...chapter,
        courseId: chapter.course_id,
        estimatedDuration: chapter.estimated_duration,
      }));

      return processedData;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(
        'Unexpected error in ChapterRepository createChapters:',
        error
      );
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async getChaptersByCourseId(courseId: string): Promise<Chapter[]> {
    try {
      const { data, error } = await this.supabase
        .from('chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      if (error) {
        logger.error(`Error fetching chapters for course ${courseId}:`, error);
        throw new AppError(`Failed to fetch chapters: ${error.message}`, 500);
      }

      const processedData = (data || []).map((chapter) => ({
        ...chapter,
        courseId: chapter.course_id,
        estimatedDuration: chapter.estimated_duration,
        courseName: chapter.courses,
      }));

      console.log(processedData);

      return processedData;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(
        'Unexpected error in ChapterRepository getChaptersByCourseId:',
        error
      );
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }
}
