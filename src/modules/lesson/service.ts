import { convexClient, api } from "../../core/convex";
import {
  type UpdateLessonDTO,
  type Lesson,
  type GenerateLessonRequest,
  lessonsSchema,
} from "./types";
import { LessonValidation } from "./validation";
import { logger } from "../../core/utils/loggers";
import {
  buildLessonsPrompt,
  type LessonPromptMode,
} from "../../core/ai/prompts/lesson-temp";
import { geminiCall } from "../../core/ai/geminiCall";

export class LessonService {
  /**
   * Get a single lesson by ID
   */
  async getLessonById(id: string): Promise<Lesson> {
    try {
      const lesson = await convexClient.query((api as any).lessons.getLesson, {
        id,
      });

      if (!lesson) {
        throw new Error("Lesson not found");
      }

      return lesson;
    } catch (error) {
      logger.error("Error fetching lesson:", error);
      throw error;
    }
  }

  /**
   * Get all lessons for a chapter
   */
  async getLessonsByChapter(chapterId: string): Promise<Lesson[]> {
    try {
      const lessons = await convexClient.query(
        (api as any).lessons.getLessonsByChapter,
        {
          chapterId,
        },
      );

      return lessons;
    } catch (error) {
      logger.error("Error fetching lessons by chapter:", error);
      throw error;
    }
  }

  /**
   * Get all lessons for a course
   */
  async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    try {
      const lessons = await convexClient.query(
        (api as any).lessons.getLessonsByCourse,
        {
          courseId,
        },
      );

      return lessons;
    } catch (error) {
      logger.error("Error fetching lessons by course:", error);
      throw error;
    }
  }

  /**
   * Create a new lesson
   */
  async createLesson(data: CreateLessonDTO): Promise<Lesson> {
    try {
      LessonValidation.validateCreateLesson(data);

      const lesson = await convexClient.mutation(
        (api as any).lessons.createLesson,
        data,
      );

      logger.info(`Lesson created: ${lesson._id}`);
      return lesson;
    } catch (error) {
      logger.error("Error creating lesson:", error);
      throw error;
    }
  }

  /**
   * Update an existing lesson
   */
  async updateLesson(id: string, data: UpdateLessonDTO): Promise<Lesson> {
    try {
      LessonValidation.validateUpdateLesson(data);

      const updated = await convexClient.mutation(
        (api as any).lessons.updateLesson,
        {
          id,
          updates: data,
        },
      );

      logger.info(`Lesson updated: ${id}`);
      return updated;
    } catch (error) {
      logger.error("Error updating lesson:", error);
      throw error;
    }
  }

  /**
   * Delete a lesson
   */
  async deleteLesson(id: string): Promise<void> {
    try {
      await convexClient.mutation((api as any).lessons.deleteLesson, {
        id,
      });

      logger.info(`Lesson deleted: ${id}`);
    } catch (error) {
      logger.error("Error deleting lesson:", error);
      throw error;
    }
  }

  public async generateLessonData(
    request: GenerateLessonRequest,
  ): Promise<Array<Omit<Lesson, "id" | "chapterId">>> {
    try {
      const promptMode: LessonPromptMode = request.promptMode ?? "legacy";
      const { userPrompt, systemPrompt } = buildLessonsPrompt(
        {
          chapterId: request.chapterId,
          chapterName: request.chapterName,
          chapterDescription: request.chapterDescription,
          chapterOrder: request.chapterOrder,
          learningObjectives: request.learningObjectives,
          keyTopics: request.keyTopics,
          estimatedDuration: request.estimatedDuration,
          courseName: request.courseName,
          level: request.level,
          language: request.language,
          userInstructions: request.userInstructions,
        },
        { mode: promptMode },
      );

      const result = await geminiCall(userPrompt, {
        responseSchema: lessonsSchema,
        temperature: 0.7,
        maxRetries: 3,
        systemPrompt,
        benchmarkTag: `lessons:${promptMode}`,
        metadata: {
          chapterName: request.chapterName,
          courseName: request.courseName,
        },
      });

      logger.info("Lessons data generated (staged)", {
        mode: promptMode,
        lessonCount: result?.lessons?.length ?? 0,
      });

      if (!result.lessons || !Array.isArray(result.lessons)) {
        throw new Error("Invalid response from Gemini: missing lessons array");
      }

      return result.lessons;
    } catch (error) {
      logger.error("Error in LessonService.generateLessonsData:", error);
      throw error;
    }
  }

  public async generateLessonsDataStreaming(
    request: GenerateLessonRequest,
    onChunk: (chunk: string) => void,
  ): Promise<Array<Omit<Lesson, "id" | "chapterId">>> {
    try {
      const promptMode: LessonPromptMode = request.promptMode ?? "legacy";
      const { userPrompt, systemPrompt } = buildLessonsPrompt(
        {
          chapterId: request.chapterId,
          chapterName: request.chapterName,
          chapterDescription: request.chapterDescription,
          chapterOrder: request.chapterOrder,
          learningObjectives: request.learningObjectives,
          keyTopics: request.keyTopics,
          estimatedDuration: request.estimatedDuration,
          courseName: request.courseName,
          level: request.level,
          language: request.language,
          userInstructions: request.userInstructions,
        },
        { mode: promptMode },
      );

      let fullResponse = "";
      await geminiCall(userPrompt, {
        responseSchema: lessonsSchema,
        temperature: 0.7,
        maxRetries: 3,
        systemPrompt,
        stream: true,
        onChunk: (chunk: string) => {
          fullResponse += chunk;
          onChunk(chunk);
        },
        benchmarkTag: `lessons:${promptMode}:stream`,
        metadata: {
          chapterName: request.chapterName,
          courseName: request.courseName,
        },
      });

      let result: any;
      try {
        logger.info("Raw streamed lessons response received", {
          fullResponseLength: fullResponse.length,
          first500: fullResponse.substring(0, 500),
          last500: fullResponse.substring(
            Math.max(0, fullResponse.length - 500),
          ),
        });

        let cleaned = fullResponse.trim();
        if (cleaned.startsWith("```")) {
          logger.info("Stripping markdown code fences from response");
          cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "");
          cleaned = cleaned.replace(/\n?```\s*$/, "");
        }

        logger.info("Cleaned response before JSON.parse", {
          cleanedLength: cleaned.length,
          first500: cleaned.substring(0, 500),
          last500: cleaned.substring(Math.max(0, cleaned.length - 500)),
        });

        result = JSON.parse(cleaned);
        logger.info("Successfully parsed streamed lessons JSON", {
          hasLessons: !!result?.lessons,
          lessonsIsArray: Array.isArray(result?.lessons),
          lessonCount: result?.lessons?.length ?? 0,
          topLevelKeys: Object.keys(result ?? {}),
        });
      } catch (parseError: any) {
        logger.error("Failed to parse streamed lessons response", {
          errorMessage: parseError?.message ?? String(parseError),
          errorStack: parseError?.stack,
          fullResponseLength: fullResponse.length,
          first500: fullResponse.substring(0, 500),
          last500: fullResponse.substring(
            Math.max(0, fullResponse.length - 500),
          ),
        });
        throw new Error("Failed to parse lessons data from streamed response");
      }

      logger.info("Lessons data generated via streaming (staged)", {
        mode: promptMode,
        lessonCount: result?.lessons?.length ?? 0,
      });

      if (!result.lessons || !Array.isArray(result.lessons)) {
        throw new Error("Invalid response from Gemini: missing lessons array");
      }

      return result.lessons;
    } catch (error) {
      logger.error(
        "Error in LessonService.generateLessonsDataStreaming:",
        error,
      );
      throw error;
    }
  }
}
