import type { Request, Response, NextFunction } from 'express';
import type { LessonService } from './service';
import { logger } from '../../utils/loggers';
import { youtubeService } from '../../utils/service/youtube.service';
import { youtubeTranscriptService } from '../../utils/service/youtube-transcript.service';

export class LessonController {
  private service: LessonService;

  constructor(service: LessonService) {
    this.service = service;
  }

  async getLessons(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { chapterId } = request.params;
      const lessons = await this.service.getLessons(chapterId!);

      response.status(200).send(lessons);
    } catch (error) {
      logger.error('Error in LessonController.getLessons:', error);
      next(error);
    }
  }

  async generateLessons(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const lessonRequest = request.body;
      const createdLessons = await this.service.generateLessons(lessonRequest);

      response.status(201).json({
        data: createdLessons,
        message: 'Lessons generated successfully',
      });
    } catch (error) {
      logger.error('Error in LessonController.generateLessons:', error);
      next(error);
    }
  }

  async getLessonById(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { lessonId } = request.params;
      const lesson = await this.service.getLessonById(lessonId!);

      response.status(200).send(lesson);
    } catch (error) {
      logger.error('Error in LessonController.getLessonById:', error);
      next(error);
    }
  }

  async updateLesson(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { lessonId } = request.params;
      const lessonData = request.body;
      const updatedLesson = await this.service.updateLesson(
        lessonId!,
        lessonData
      );

      response.status(200).json({
        data: updatedLesson,
        message: 'Lesson updated successfully',
      });
    } catch (error) {
      logger.error('Error in LessonController.updateLesson:', error);
      next(error);
    }
  }

  async deleteLesson(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { lessonId } = request.params;
      await this.service.deleteLesson(lessonId!);

      response.status(200).json({
        message: 'Lesson deleted successfully',
      });
    } catch (error) {
      logger.error('Error in LessonController.deleteLesson:', error);
      next(error);
    }
  }

  async getLessonVideos(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { lessonId } = request.params;
      const maxResults = parseInt(request.query.maxResults as string) || 5;

      const lesson = await this.service.getLessonById(lessonId!);

      if (!lesson) {
        response.status(404).json({ error: 'Lesson not found' });
        return;
      }

      if (lesson.type !== 'video' || !lesson.videoSearchQuery) {
        response.status(400).json({
          error: 'This lesson does not have a video search query',
        });
        return;
      }

      const videos = await youtubeService.searchVideos(
        lesson.videoSearchQuery,
        maxResults
      );

      response.status(200).json(videos);
    } catch (error) {
      logger.error('Error in LessonController.getLessonVideos:', error);
      next(error);
    }
  }

  async fetchTranscript(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { lessonId } = request.params;
      const { videoId, language } = request.body;

      if (!videoId) {
        response.status(400).json({ error: 'videoId is required' });
        return;
      }

      const lesson = await this.service.getLessonById(lessonId!);

      if (!lesson) {
        response.status(404).json({ error: 'Lesson not found' });
        return;
      }

      if (lesson.type !== 'video') {
        response.status(400).json({
          error: 'Transcript can only be fetched for video lessons',
        });
        return;
      }

      const transcript = await youtubeTranscriptService.getTranscript(
        videoId,
        language || 'en'
      );

      console.log('Fetched transcript:', transcript);

      if (!transcript) {
        response.status(404).json({
          error:
            'No transcript available for this video. The video may not have captions enabled.',
        });
        return;
      }

      // const updatedLesson = await this.service.updateLesson(lessonId!, {
      //   selectedVideoId: videoId,
      //   videoTranscript: transcript.fullText,
      //   transcriptLanguage: transcript.language,
      //   transcriptFetchedAt: new Date().toISOString(),
      //   content: transcript.fullText,
      // });

      const stats = youtubeTranscriptService.getTranscriptStats(transcript);

      console.log('Transcript stats:', stats);

      response.status(200).json({
        message: 'Transcript fetched successfully',
        transcript: transcript.fullText,
        language: transcript.language,
        stats,
        lesson: null,
      });
    } catch (error) {
      logger.error('Error in LessonController.fetchTranscript:', error);
      next(error);
    }
  }

  async getTranscript(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { lessonId } = request.params;
      const { withTimestamps } = request.query;

      const lesson = await this.service.getLessonById(lessonId!);

      if (!lesson) {
        response.status(404).json({ error: 'Lesson not found' });
        return;
      }

      if (lesson.type !== 'video') {
        response.status(400).json({
          error: 'Transcript is only available for video lessons',
        });
        return;
      }

      // If transcript is already stored, return it
      if (lesson.videoTranscript) {
        response.status(200).json({
          transcript: lesson.videoTranscript,
          language: lesson.transcriptLanguage || 'en',
          fetchedAt: lesson.transcriptFetchedAt,
        });
        return;
      }

      // If no stored transcript but has selectedVideoId, try to fetch it
      if (lesson.selectedVideoId) {
        const transcript = await youtubeTranscriptService.getTranscript(
          lesson.selectedVideoId
        );

        if (transcript) {
          // Auto-save the fetched transcript
          await this.service.updateLesson(lessonId!, {
            videoTranscript: transcript.fullText,
            transcriptLanguage: transcript.language,
            transcriptFetchedAt: new Date().toISOString(),
            content: transcript.fullText,
          });

          response.status(200).json({
            transcript: transcript.fullText,
            language: transcript.language,
            fetchedAt: new Date().toISOString(),
          });
          return;
        }
      }

      response.status(404).json({
        error: 'No transcript available for this lesson',
      });
    } catch (error) {
      logger.error('Error in LessonController.getTranscript:', error);
      next(error);
    }
  }
}
