import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../../core/utils/errors';
import { logger } from '../../core/utils/loggers';
import {
  CreateLessonData,
  Lesson,
  CreateResourceData,
  LessonResource,
} from './types';

export class LessonRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async checkChapterExists(chapterId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('chapters')
        .select('id')
        .eq('id', chapterId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error(`Error checking chapter existence:`, error);
        throw new AppError(`Failed to verify chapter: ${error.message}`, 500);
      }

      return !!data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Unexpected error in checkChapterExists:', error);
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async createLesson(lessonData: CreateLessonData): Promise<Lesson> {
    try {
      const dataToInsert = {
        chapter_id: lessonData.chapterId,
        title: lessonData.title,
        type: lessonData.type,
        description: lessonData.description,
        duration: lessonData.duration,
        content: lessonData.content,
        video_url: lessonData.videoUrl,
        order: lessonData.order,
      };

      const { data, error } = await this.supabase
        .from('lessons')
        .insert(dataToInsert)
        .select('*')
        .single();

      if (error) {
        logger.error('Error creating lesson:', error);
        throw new AppError(`Failed to create lesson: ${error.message}`, 500);
      }

      if (!data) {
        throw new AppError('Lesson creation returned no data', 500);
      }

      return {
        ...data,
        chapterId: data.chapter_id,
        videoUrl: data.video_url,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Unexpected error in createLesson:', error);
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async createLessonResources(
    lessonId: string,
    resources: CreateResourceData[]
  ): Promise<LessonResource[]> {
    try {
      const resourcesToInsert = resources.map((resource) => ({
        lesson_id: lessonId,
        title: resource.title,
        url: resource.url,
        type: resource.type,
      }));

      const { data, error } = await this.supabase
        .from('lesson_resources')
        .insert(resourcesToInsert)
        .select('*');

      if (error) {
        logger.error('Error creating lesson resources:', error);
        throw new AppError(
          `Failed to create lesson resources: ${error.message}`,
          500
        );
      }

      const processedData = (data || []).map((resource) => ({
        ...resource,
        lessonId: resource.lesson_id,
      }));

      return processedData;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Unexpected error in createLessonResources:', error);
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async getLessonsByChapterId(chapterId: string): Promise<Lesson[]> {
    try {
      const { data, error } = await this.supabase
        .from('lessons')
        .select(
          `
          *,
          lesson_resources (*),
          quizzes (
            *,
            quiz_questions (
              *,
              quiz_options (id, option_text)
            )
          )
        `
        )
        .eq('chapter_id', chapterId)
        .order('order', { ascending: true });

      if (error) {
        logger.error(`Error fetching lessons for chapter ${chapterId}:`, error);
        throw new AppError(`Failed to fetch lessons: ${error.message}`, 500);
      }

      const processedData = (data || []).map((lesson) => ({
        ...lesson,
        chapterId: lesson.chapter_id,
        videoUrl: lesson.video_url,
        resources:
          lesson.lesson_resources?.map((resource: any) => ({
            ...resource,
            lessonId: resource.lesson_id,
          })) || [],
        quiz:
          lesson.quizzes?.length > 0
            ? {
                id: lesson.quizzes[0].id,
                questions: lesson.quizzes[0].quiz_questions.map((q: any) => ({
                  ...q,
                  options: q.quiz_options.map((o: any) => o.option_text),
                })),
              }
            : undefined,
      }));

      return processedData;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Unexpected error in getLessonsByChapterId:', error);
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async getLessonById(id: string): Promise<Lesson> {
    try {
      const { data, error } = await this.supabase
        .from('lessons')
        .select(
          `
          *,
          lesson_resources (*),
          quizzes (
            *,
            quiz_questions (
              *,
              quiz_options (id, option_text)
            )
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        logger.error(`Error fetching lesson with ID ${id}:`, error);
        throw new AppError(`Lesson not found: ${error.message}`, 404);
      }

      if (!data) {
        throw new AppError('Lesson not found', 404);
      }

      return {
        ...data,
        chapterId: data.chapter_id,
        videoUrl: data.video_url,
        resources:
          data.lesson_resources?.map((resource: any) => ({
            ...resource,
            lessonId: resource.lesson_id,
          })) || [],
        quiz:
          data.quizzes?.length > 0
            ? {
                id: data.quizzes[0].id,
                questions: data.quizzes[0].quiz_questions.map((q: any) => ({
                  ...q,
                  options: q.quiz_options.map((o: any) => o.option_text),
                })),
              }
            : undefined,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Unexpected error in getLessonById:', error);
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async getLessonResources(lessonId: string): Promise<LessonResource[]> {
    try {
      const { data, error } = await this.supabase
        .from('lesson_resources')
        .select('*')
        .eq('lesson_id', lessonId);

      if (error) {
        logger.error(`Error fetching resources for lesson ${lessonId}:`, error);
        throw new AppError(
          `Failed to fetch lesson resources: ${error.message}`,
          500
        );
      }

      // Convert snake_case to camelCase
      const processedData = (data || []).map((resource) => ({
        ...resource,
        lessonId: resource.lesson_id,
      }));

      return processedData;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Unexpected error in getLessonResources:', error);
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async createQuiz(lessonId: string): Promise<{ id: string }> {
    try {
      const { data, error } = await this.supabase
        .from('quizzes')
        .insert({ lesson_id: lessonId })
        .select('id')
        .single();

      if (error) {
        logger.error('Error creating quiz:', error);
        throw new AppError(`Failed to create quiz: ${error.message}`, 500);
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Unexpected error in LessonRepository createQuiz:', error);
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async createQuestion(
    quizId: string,
    question: string,
    type: string,
    correctAnswer: string,
    explanation?: string
  ): Promise<{ id: string }> {
    try {
      const { data, error } = await this.supabase
        .from('quiz_questions')
        .insert({
          quiz_id: quizId,
          question,
          type,
          correct_answer: correctAnswer,
          explanation,
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Error creating quiz question:', error);
        throw new AppError(`Failed to create question: ${error.message}`, 500);
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(
        'Unexpected error in LessonRepository createQuestion:',
        error
      );
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }

  async createOption(questionId: string, optionText: string): Promise<void> {
    try {
      const { error } = await this.supabase.from('quiz_options').insert({
        question_id: questionId,
        option_text: optionText,
      });

      if (error) {
        logger.error('Error creating quiz option:', error);
        throw new AppError(`Failed to create option: ${error.message}`, 500);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Unexpected error in LessonRepository createOption:', error);
      throw new AppError(`Unexpected error: ${(error as Error).message}`, 500);
    }
  }
}
