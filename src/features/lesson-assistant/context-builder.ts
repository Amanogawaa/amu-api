/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LessonContext } from "./types";
import { LessonRepository } from "../lesson/repository";
import { logger } from "../../utils/loggers";
import { NotFoundError } from "../../utils/errors";

export class ContextBuilder {
  private lessonRepository: LessonRepository;
  private contextCache: Map<
    string,
    { context: LessonContext; timestamp: number }
  >;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(lessonRepository: LessonRepository) {
    this.lessonRepository = lessonRepository;
    this.contextCache = new Map();
  }

  async buildLessonContext(lessonId: string): Promise<LessonContext> {
    try {
      const cached = this.contextCache.get(lessonId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        logger.info("Context cache hit", { lessonId });
        return cached.context;
      }

      logger.info("Building lesson context", { lessonId });

      const lesson = await this.lessonRepository.getLesson(lessonId);
      if (!lesson) {
        throw new NotFoundError("Lesson not found");
      }

      const chapter = await this.lessonRepository.getChapterForLesson(
        lesson.chapterId,
      );
      if (!chapter) {
        throw new NotFoundError("Chapter not found");
      }

      const course = await this.lessonRepository.getCourseForLesson(
        lesson.chapterId,
      );
      if (!course) {
        throw new NotFoundError("Course not found");
      }

      const context: LessonContext = {
        lesson: {
          id: lesson.id,
          name: lesson.lessonName,
          description: lesson.lessonDescription,
          content: lesson.content,
          type: lesson.type,
          learningOutcome: lesson.learningOutcome,
          prerequisites: lesson.prerequisites || [],
          resources: lesson.resources || [],
        },
        chapter: {
          id: chapter.id,
          name: chapter.chapterName,
          description: chapter.chapterDescription,
          learningObjectives: chapter.learningObjectives || [],
          keyTopics: chapter.keyTopics || [],
        },
        course: {
          id: course.id,
          name: course.name,
          level: course.level,
          category: course.category,
          description: course.description,
        },
        videoTranscript: this.getVideoTranscript(lesson),
      };

      // Cache the context
      this.contextCache.set(lessonId, {
        context,
        timestamp: Date.now(),
      });

      logger.info("Context built successfully", {
        lessonId,
        lessonName: lesson.lessonName,
        hasTranscript: !!context.videoTranscript,
      });

      return context;
    } catch (error) {
      logger.error("Error building lesson context:", error);
      throw error;
    }
  }

  private getVideoTranscript(lesson: any): string | undefined {
    if (lesson.type !== "video" || !lesson.videoTranscript) {
      return undefined;
    }

    // Truncate transcript if too long (max 8000 chars)
    const MAX_TRANSCRIPT_LENGTH = 8000;
    if (lesson.videoTranscript.length > MAX_TRANSCRIPT_LENGTH) {
      return lesson.videoTranscript.substring(0, MAX_TRANSCRIPT_LENGTH) + "...";
    }

    return lesson.videoTranscript;
  }

  invalidateCache(lessonId: string): void {
    this.contextCache.delete(lessonId);
    logger.info("Context cache invalidated", { lessonId });
  }

  clearCache(): void {
    this.contextCache.clear();
    logger.info("Context cache cleared");
  }
}
