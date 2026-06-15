/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from "@utils/loggers";
import { AppError } from "../../utils/errors";
import { geminiCall } from "../../utils/geminiCall";
import { generateExerciseGuidelinePrompt } from "../../utils/prompts/exercise-guideline-temp";
import { CodePlaygroundRepository } from "./repository";
import type { ExerciseGuideline } from "./types";
import { exerciseGuidelineSchema } from "./types";

export class CodePlaygroundService {
  private repository: CodePlaygroundRepository;
  private courseRepository?: any;
  private chapterRepository?: any;
  private lessonRepository?: any;

  constructor(
    repository: CodePlaygroundRepository,
    courseRepository?: any,
    chapterRepository?: any,
    lessonRepository?: any,
  ) {
    this.repository = repository;
    this.courseRepository = courseRepository;
    this.chapterRepository = chapterRepository;
    this.lessonRepository = lessonRepository;
  }

  async generateGuideline(lessonId: string): Promise<ExerciseGuideline> {
    try {
      const existing = await this.repository.getGuidelineByLessonId(lessonId);

      if (existing) {
        logger.info(
          `Exercise guideline already exists for lesson: ${lessonId}`,
        );
        return existing;
      }

      if (!this.lessonRepository || !this.courseRepository) {
        throw new AppError(
          "Lesson and Course repositories not initialized",
          500,
        );
      }

      logger.info("Fetching lesson context from database", { lessonId });
      const lesson = await this.lessonRepository.getLessonById(lessonId);

      if (!lesson) {
        throw new AppError("Lesson not found", 404);
      }

      const course = await this.courseRepository.getCourseById(lesson.courseId);

      if (!course) {
        throw new AppError("Course not found", 404);
      }

      const prompt = generateExerciseGuidelinePrompt({
        lessonId,
        lessonName: lesson.lessonName,
        lessonDescription: lesson.lessonDescription,
        courseId: course.id,
        courseName: course.name,
        chapterName: lesson.chapterName || "",
        difficulty: (course.level || "intermediate") as
          | "beginner"
          | "intermediate"
          | "advanced",
        language: lesson.language || "javascript",
        topics: lesson.keyTopics || [],
        estimatedDuration: lesson.duration || "30m",
        learningOutcome: lesson.learningOutcome || "",
      });

      logger.info("Generating exercise guideline with AI", { lessonId });

      const result = await geminiCall(prompt, {
        responseSchema: exerciseGuidelineSchema,
        temperature: 0.4,
        maxRetries: 3,
      });

      logger.info("Exercise guideline generated successfully");

      const guidelineData = {
        lessonId,
        courseId: course.id,
        title: result.title || `Exercise: ${lesson.lessonName}`,
        description: result.description || lesson.lessonDescription,
        ...result,
      };

      const createdGuideline =
        await this.repository.createGuideline(guidelineData);

      return createdGuideline;
    } catch (error) {
      logger.error("Error in CodePlaygroundService.generateGuideline:", error);
      throw error;
    }
  }

  async getGuidelineByLessonId(
    lessonId: string,
  ): Promise<ExerciseGuideline | null> {
    try {
      return await this.repository.getGuidelineByLessonId(lessonId);
    } catch (error) {
      logger.error(
        "Error in CodePlaygroundService.getGuidelineByLessonId:",
        error,
      );
      throw error;
    }
  }

  async getGuidelineById(id: string): Promise<ExerciseGuideline> {
    try {
      return await this.repository.getGuidelineById(id);
    } catch (error) {
      logger.error("Error in CodePlaygroundService.getGuidelineById:", error);
      throw error;
    }
  }

  async getGuidelinesByCourseId(
    courseId: string,
  ): Promise<ExerciseGuideline[]> {
    try {
      return await this.repository.getGuidelinesByCourseId(courseId);
    } catch (error) {
      logger.error(
        "Error in CodePlaygroundService.getGuidelinesByCourseId:",
        error,
      );
      throw error;
    }
  }
}
