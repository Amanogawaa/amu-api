import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../core/utils/loggers';
import { AppError } from '../../core/utils/errors';
import { Course } from './type';

export class CourseRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async createCourse(
    courseData: Omit<Course, 'id' | 'created_at' | 'update_at'>
  ): Promise<Course> {
    console.log('CourseData', courseData);
    try {
      const dataToInsert = {
        ...courseData,
        learning_outcomes: Array.isArray(courseData.learning_outcomes)
          ? JSON.stringify(courseData.learning_outcomes)
          : courseData.learning_outcomes,
      };

      const { data, error } = await this.supabase
        .from('courses')
        .insert(dataToInsert)
        .select('*')
        .single();

      if (error) {
        logger.error('Error creating course:', error);
        throw new AppError(`Failed to create course: ${error.message}`, 500);
      }

      if (!data) {
        throw new AppError('Course creation returned no data', 500);
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Unexpected error in CourseRepository:', error);
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async getCourse(id?: string, limit: number = 10, offset: number = 0) {
    try {
      if (id) {
        console.log(id);
        const { data, error } = await this.supabase
          .from('courses')
          .select(
            'id, name, level, description, topic, subtitle, banner_url, category, prerequisites, learning_outcomes, duration, language, no_of_chapters'
          )
          .eq('id', id)
          .single();

        if (error) {
          logger.error(`Error fetching course with ID ${id}:`, error);
          throw new AppError(`Course not found: ${error.message}`, 404);
        }

        if (!data) {
          throw new AppError('Course not found', 404);
        }

        return data;
      }

      const { data, error, count } = await this.supabase
        .from('courses')
        .select(
          'id, name, level, description, topic, subtitle, banner_url, category, prerequisites, learning_outcomes, duration, language, no_of_chapters',
          { count: 'exact' }
        )
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Error fetching courses:', error);
        throw new AppError(`Failed to fetch courses: ${error.message}`, 500);
      }

      return {
        courses: data || [],
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Unexpected error in CourseRepository:', error);
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }
}
