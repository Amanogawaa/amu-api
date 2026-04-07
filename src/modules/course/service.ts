import type { Id } from "../../../convex/_generated/dataModel";
import type { CourseCreationResult } from "../../../migration/src/features/course/repository";
import { geminiCall } from "../../core/ai/geminiCall";
import { buildCoursePrompt } from "../../core/ai/prompts/course-temp";
import { api, convexClient } from "../../core/convex";
import type { StagedCourseData } from "../../core/service/generation.service";
import { logger } from "../../core/utils/loggers";
import {
  courseSchema,
  type Course,
  type CoursePromptMode,
  type CourseQueryParams,
  type CourseWithStats,
  type GenerateCourseRequest,
} from "./types";

export class CourseService {
  /**
   * Get all courses with optional filtering
   */
  async getAllCourses(params?: CourseQueryParams): Promise<Course[]> {
    try {
      const courses = await convexClient.query(api.courses.getAllCourses, {
        category: params?.category,
        level: params?.level,
        publishedOnly: params?.publishedOnly,
        limit: params?.limit,
      });

      return courses;
    } catch (error) {
      logger.error("Error fetching courses:", error);
      throw error;
    }
  }

  /**
   * Get a single course by ID
   */
  async getCourseById(id: string): Promise<Course> {
    try {
      const course = await convexClient.query(api.courses.getCourse, {
        id: id as Id<"courses">,
      });

      if (!course) {
        throw new Error("Course not found");
      }

      return course;
    } catch (error) {
      logger.error("Error fetching course:", error);
      throw error;
    }
  }

  /**
   * Get course with details (chapters, enrollments, comments, likes)
   */
  async getCourseWithDetails(id: string): Promise<CourseWithStats> {
    try {
      const courseData = await convexClient.query(
        api.courses.getCourseWithDetails,
        {
          id: id as Id<"courses">,
        },
      );

      if (!courseData) {
        throw new Error("Course not found");
      }

      return courseData;
    } catch (error) {
      logger.error("Error fetching course with details:", error);
      throw error;
    }
  }

  /**
   * Get courses created by a specific user
   */
  async getCoursesByUser(userId: string): Promise<Course[]> {
    try {
      const courses = await convexClient.query(api.courses.getCoursesByUser, {
        userId: userId as Id<"users">,
      });

      return courses;
    } catch (error) {
      logger.error("Error fetching user courses:", error);
      throw error;
    }
  }

  /**
   * Create a new course
   */
  // prolly need to delete this later
  async createCourse(
    userId: string,
    data: GenerateCourseRequest,
  ): Promise<Course> {
    try {
      const course = await convexClient.mutation(
        (api as any).courses.createCourse,
        {
          userId: userId as Id<"users">,
          ...data,
        },
      );

      return course;
    } catch (error) {
      logger.error("Error creating course:", error);
      throw error;
    }
  }

  /**
   * Delete a course
   */
  async deleteCourse(id: string): Promise<void> {
    try {
      await convexClient.mutation(api.courses.deleteCourse, {
        id: id as Id<"courses">,
      });

      logger.info(`Course deleted: ${id}`);
    } catch (error) {
      logger.error("Error deleting course:", error);
      throw error;
    }
  }

  public async generateCourseDataStreaming(
    request: GenerateCourseRequest,
    onChunk: (chunk: string) => void,
  ): Promise<Course> {
    try {
      const promptMode: CoursePromptMode = request.promptMode || "system";
      const { userPrompt, systemPrompt } = buildCoursePrompt(
        {
          category: request.category,
          topic: request.topic,
          level: request.level,
          duration: request.duration,
          noOfChapters: request.noOfChapters,
          language: request.language,
          userInstructions: request.userInstructions ?? "",
        },
        promptMode,
      );

      let fullResponse = "";

      await geminiCall(userPrompt, {
        responseSchema: courseSchema,
        temperature: 0.7,
        maxRetries: 3,
        systemPrompt,
        stream: true,
        onChunk: (chunk: string) => {
          fullResponse += chunk;
          onChunk(chunk);
        },
        benchmarkTag: `course:${promptMode}:stream`,
        metadata: {
          topic: request.topic,
          level: request.level,
        },
      });

      let parsed: any;
      try {
        let cleaned = fullResponse.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "");
          cleaned = cleaned.replace(/\n?```\s*$/, "");
        }
        parsed = JSON.parse(cleaned);
      } catch (parseError) {
        logger.error("Failed to parse streamed course response", {
          parseError,
        });
        throw new Error("Failed to parse course data from streamed response");
      }

      logger.info("Course data generated via streaming (staged)", {
        mode: promptMode,
        topic: request.topic,
        uid: request.uid,
        name: parsed?.name,
      });

      const courseData = {
        ...parsed,
        userId: request.uid,
        publish: false,
        draft: true,
      };

      const nameExist = await convexClient.query(
        (api as any).courses.checkCourseExistence,
        {
          courseName: courseData.name,
        },
      );

      if (nameExist) {
        throw new Error(
          "Course with the same name already exists. Please choose a different name.",
        );
      }

      return courseData;
    } catch (error) {
      logger.error(
        "Error in CourseService.generateCourseDataStreaming:",
        error,
      );
      throw error;
    }
  }

  public async createCourseWithRelations(
    staged: StagedCourseData,
  ): Promise<CourseCreationResult> {
    try {
      return await convexClient.mutation(
        (api as any).courses.createCourseWithRelations,
        staged,
      );
    } catch (error) {
      logger.error("Error in CourseService.createCourseWithRelations:", error);
      throw error;
    }
  }
}
