import { geminiCall } from '../../utils/geminiCall';
import { logger } from '../../utils/loggers';
import { generateLessonsPrompt } from '../../utils/prompts/lesson-temp';
import { LessonRepository } from './repository';
import {
  lessonsSchema,
  type GenerateLessonRequest,
  type Lesson,
} from './types';
import { youtubeService } from '../../utils/youtube.service';
import { youtubeTranscriptService } from '../../utils/youtube-transcript.service';

export class LessonService {
  private lessonRepository: LessonRepository;

  constructor(lessonRepository: LessonRepository) {
    this.lessonRepository = lessonRepository;
  }

  public async getLessons(chapterId: string) {
    try {
      const lessons = await this.lessonRepository.getLessons(chapterId);
      return lessons;
    } catch (error) {
      logger.error('Error in LessonService.getLessons:', error);
      throw error;
    }
  }

  public async generateLessons(request: GenerateLessonRequest) {
    try {
      const prompt = generateLessonsPrompt({
        chapterId: request.chapterId,
        chapterName: request.chapterName,
        chapterDescription: request.chapterDescription,
        chapterOrder: request.chapterOrder,
        learningObjectives: request.learningObjectives,
        keyTopics: request.keyTopics,
        estimatedDuration: request.estimatedDuration,
        estimatedLessonCount: request.estimatedLessonCount,
        courseName: request.courseName,
        moduleName: request.moduleName,
        level: request.level,
        language: request.language,
      });

      const result = await geminiCall(prompt, {
        responseSchema: lessonsSchema,
        temperature: 0.7,
        maxRetries: 3,
      });

      logger.info('Raw Gemini response:', result);

      if (!result.lessons || !Array.isArray(result.lessons)) {
        throw new Error('Invalid response from Gemini: missing lessons array');
      }

      const createdLessons = await this.lessonRepository.createLessons(
        request.chapterId,
        result.lessons
      );

      logger.info(`Successfully created ${createdLessons.length} lessons`);

      this.autoFetchTranscriptsForVideoLessons(createdLessons).catch((error) =>
        logger.error('Error auto-fetching transcripts:', error)
      );

      return createdLessons;
    } catch (error) {
      logger.error('Error in LessonService.generateLessons:', error);
      throw error;
    }
  }

  /**
   * Auto-fetch transcripts for video lessons
   * Runs in background after lesson generation
   */
  private async autoFetchTranscriptsForVideoLessons(
    lessons: Lesson[]
  ): Promise<void> {
    logger.info('Starting auto-fetch transcripts for video lessons...');

    for (const lesson of lessons) {
      if (lesson.type === 'video' && lesson.videoSearchQuery) {
        try {
          logger.info(
            `Fetching video and transcript for lesson: ${lesson.lessonName}`
          );

          // 1. Search for videos
          const videos = await youtubeService.searchVideos(
            lesson.videoSearchQuery,
            1 // Get top result only
          );

          if (videos.videos.length === 0) {
            logger.warn(
              `No videos found for lesson ${lesson.id}: ${lesson.videoSearchQuery}`
            );
            continue;
          }

          const topVideo = videos.videos[0];

          if (!topVideo) {
            logger.warn(`No valid video found for lesson ${lesson.id}`);
            continue;
          }

          logger.info(
            `Selected video: ${topVideo.title} (${topVideo.videoId})`
          );

          // 2. Fetch transcript
          const transcript = await youtubeTranscriptService.getTranscript(
            topVideo.videoId
          );

          if (transcript) {
            // 3. Update lesson with video and transcript
            await this.updateLesson(lesson.id, {
              selectedVideoId: topVideo.videoId,
              content: transcript.fullText, // Store transcript in content field
              videoTranscript: transcript.fullText,
              transcriptLanguage: transcript.language,
              transcriptFetchedAt: new Date().toISOString(),
            });

            const stats =
              youtubeTranscriptService.getTranscriptStats(transcript);
            logger.info(
              `✅ Transcript fetched for lesson ${lesson.id}: ${stats.wordCount} words, ${stats.duration}s duration`
            );
          } else {
            logger.warn(
              `No transcript available for video ${topVideo.videoId} (lesson ${lesson.id})`
            );

            // Still save the video ID even without transcript
            await this.updateLesson(lesson.id, {
              selectedVideoId: topVideo.videoId,
            });
          }
        } catch (error) {
          logger.error(
            `Failed to fetch transcript for lesson ${lesson.id}:`,
            error
          );
          // Continue with other lessons
        }
      }
    }

    logger.info('Completed auto-fetch transcripts');
  }

  public async getLessonById(lessonId: string) {
    try {
      const lesson = await this.lessonRepository.getLessonById(lessonId);
      if (!lesson) {
        throw new Error('Lesson not found');
      }
      return lesson;
    } catch (error) {
      logger.error('Error in LessonService.getLessonById:', error);
      throw error;
    }
  }

  public async updateLesson(
    lessonId: string,
    lessonData: Partial<Omit<Lesson, 'id' | 'chapterId' | 'createdAt'>>
  ) {
    try {
      const updatedLesson = await this.lessonRepository.updateLesson(
        lessonId,
        lessonData
      );
      return updatedLesson;
    } catch (error) {
      logger.error('Error in LessonService.updateLesson:', error);
      throw error;
    }
  }

  public async deleteLesson(lessonId: string) {
    try {
      await this.lessonRepository.deleteLesson(lessonId);
    } catch (error) {
      logger.error('Error in LessonService.deleteLesson:', error);
      throw error;
    }
  }
}
