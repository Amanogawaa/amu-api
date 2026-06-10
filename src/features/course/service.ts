import { AppError } from "../../utils/errors";
import { logger } from "../../utils/loggers";
import {
  buildCoursePrompt,
  type CoursePromptMode,
} from "../../utils/prompts/course-temp";
import { CourseRepository, type CourseCreationResult } from "./repository";
import type { StagedCourseData } from "../../utils/service/generation.service";

import { geminiCall } from "../../utils/geminiCall";
import {
  type Course,
  type CourseQueryParams,
  type GenerateCourseRequest,
  courseSchema,
} from "./types";

/**
 * Service layer for course management.
 * Handles course CRUD operations, AI-powered course generation (standard and streaming),
 * course lifecycle management (publish/unpublish, draft/undraft), and completeness validation.
 */
export class CourseService {
  private courseRepository: CourseRepository;

  constructor(courseRepository: CourseRepository) {
    this.courseRepository = courseRepository;
  }

  /**
   * Retrieves a list of courses filtered by the given query parameters.
   * @param params - Optional filters (uid, search, level, category, language, publish, draft, pagination).
   * @returns Array of courses matching the query.
   */
  public async getCourses(params?: CourseQueryParams): Promise<Course[]> {
    try {
      const courses = await this.courseRepository.getCourse(params);
      return courses;
    } catch (error) {
      logger.error("Error in CoursesService.getCourses:", error);
      throw error;
    }
  }

  /**
   * Retrieves a single course by its document ID (slug).
   * @param slug - The Firestore document ID of the course.
   * @returns The course document.
   * @throws {AppError} 404 if the course is not found.
   */
  public async getCourseById(slug: string): Promise<Course> {
    try {
      const course = await this.courseRepository.getCourseById(slug);
      return course;
    } catch (error) {
      logger.error("Error in CoursesService.getCourseById:", error);
      throw error;
    }
  }

  /**
   * Generates a new course using Gemini AI and persists it to Firestore.
   * Uses structured JSON output with schema enforcement to ensure correct field names.
   * Automatically appends a timestamp suffix if a course with the same name already exists for the user.
   * @param request - Generation parameters (topic, category, level, duration, chapters, language, uid).
   * @returns The created course with its Firestore-generated ID.
   */
  public async generateCourse(request: GenerateCourseRequest) {
    try {
      const promptMode: CoursePromptMode = request.promptMode ?? "system";
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

      const result = await geminiCall(userPrompt, {
        responseSchema: courseSchema,
        temperature: 0.4,
        maxRetries: 3,
        systemPrompt,
        benchmarkTag: `course:${promptMode}`,
        metadata: {
          topic: request.topic,
          level: request.level,
        },
      });

      logger.info("Course generated successfully", {
        mode: promptMode,
        topic: request.topic,
        uid: request.uid,
        name: result?.name,
      });

      const courseData: Course = {
        ...result,
        uid: request.uid,
        publish: false,
        draft: true,
      };

      const nameExist = await this.courseRepository.courseNameExists(
        courseData.name,
        courseData.uid,
      );

      if (nameExist) {
        courseData.name = `${courseData.name} (${Date.now()})`;
      }

      const createdCourse =
        await this.courseRepository.createCourse(courseData);

      return createdCourse;
    } catch (error) {
      logger.error("Error in CoursesService.generateCourse:", error);
      throw error;
    }
  }

  /**
   * Generates a course using Gemini AI with real-time streaming.
   * Streams raw AI output chunks to the client via the provided callback (e.g. Socket.IO),
   * then parses the complete response, deduplicates the name, and persists to Firestore.
   * @param request - Generation parameters (topic, category, level, duration, chapters, language, uid).
   * @param userId - The authenticated user's ID.
   * @param emitChunk - Callback invoked with each streamed text chunk for real-time client updates.
   * @returns The created course with its Firestore-generated ID.
   */
  public async generateCourseStream(
    request: GenerateCourseRequest,
    userId: string,
    emitChunk: (chunk: string) => void,
  ) {
    try {
      const promptMode: CoursePromptMode = request.promptMode ?? "system";
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
        temperature: 0.4,
        maxRetries: 3,
        systemPrompt,
        stream: true,
        onChunk: async (chunk: string) => {
          fullResponse += chunk;
          emitChunk(chunk);
        },
        benchmarkTag: `course:${promptMode}:stream`,
        metadata: {
          topic: request.topic,
          level: request.level,
        },
      });

      console.log("Full streamed response:", fullResponse);

      let parsedCourse;
      try {
        let cleanedResponse = fullResponse.trim();
        if (cleanedResponse.startsWith("```")) {
          cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/, "");
          cleanedResponse = cleanedResponse.replace(/\n?```\s*$/, "");
        }

        parsedCourse = JSON.parse(cleanedResponse);

        console.log("Parsed course data from streamed response:", parsedCourse);
      } catch (parseError) {
        logger.error("Failed to parse streamed course response", {
          error: parseError,
          response: fullResponse.substring(0, 500),
        });
        throw new AppError(
          "Failed to parse course data from streamed response",
          500,
        );
      }

      logger.info("Course generated successfully (streamed)", {
        mode: promptMode,
        topic: request.topic,
        uid: request.uid,
        name: parsedCourse?.name,
      });

      const courseData: Course = {
        ...parsedCourse,
        uid: request.uid,
        publish: false,
        draft: true,
      };

      const nameExist = await this.courseRepository.courseNameExists(
        courseData.name,
        courseData.uid,
      );

      if (nameExist) {
        courseData.name = `${courseData.name} (${Date.now()})`;
      }

      const createdCourse =
        await this.courseRepository.createCourse(courseData);

      return createdCourse;
    } catch (error) {
      logger.error("Error in CoursesService.generateCourseStream:", error);
      throw error;
    }
  }

  /**
   * Deletes a course and all its related data (chapters, lessons, capstone, enrollments).
   * @param courseId - The Firestore document ID of the course to delete.
   */
  public async deleteCourse(courseId: string): Promise<void> {
    try {
      await this.courseRepository.deleteCourse(courseId);
    } catch (error) {
      logger.error("Error in CoursesService.deleteCourse:", error);
      throw error;
    }
  }

  /**
   * Validates whether a course has all required components for publishing.
   * Checks for the existence of chapters, lessons, and a capstone project.
   * @param courseId - The Firestore document ID of the course.
   * @returns Validation result with completeness status, missing components, and detailed counts.
   */
  public async validateCourseCompleteness(courseId: string): Promise<{
    isComplete: boolean;
    missingComponents: string[];
    details: {
      hasChapters: boolean;
      chaptersCount: number;
      hasLessons: boolean;
      lessonsCount: number;
      capstoneProject?: boolean;
    };
  }> {
    try {
      const firestore = this.courseRepository["firebaseStore"];

      // Fetch chapters directly by courseId
      const chaptersSnapshot = await firestore
        .collection("chapters")
        .where("courseId", "==", courseId)
        .get();

      const hasChapters = !chaptersSnapshot.empty;
      const chaptersCount = chaptersSnapshot.size;
      const chapterIds = chaptersSnapshot.docs.map((doc) => doc.id);

      let hasLessons = false;
      let lessonsCount = 0;

      if (chapterIds.length > 0) {
        const lessonPromises = [];
        for (let i = 0; i < chapterIds.length; i += 10) {
          const batch = chapterIds.slice(i, i + 10);
          lessonPromises.push(
            firestore
              .collection("lessons")
              .where("chapterId", "in", batch)
              .get(),
          );
        }

        const lessonSnapshots = await Promise.all(lessonPromises);
        lessonSnapshots.forEach((snapshot) => {
          lessonsCount += snapshot.size;
        });

        hasLessons = lessonsCount > 0;
      }

      const capstoneProjectSnapshot = await firestore
        .collection("capstoneGuidelines")
        .where("courseId", "==", courseId)
        .limit(1)
        .get();
      const capstoneProject = !capstoneProjectSnapshot.empty;

      logger.info(
        `Capstone validation for course ${courseId}: ${
          capstoneProject ? "Found" : "Not found"
        }`,
      );

      const missingComponents: string[] = [];
      if (!hasChapters) missingComponents.push("chapters");
      if (!hasLessons) missingComponents.push("lessons");
      if (!capstoneProject) missingComponents.push("capstone project");

      return {
        isComplete: hasChapters && hasLessons && capstoneProject,
        missingComponents,
        details: {
          hasChapters,
          chaptersCount,
          hasLessons,
          lessonsCount,
          capstoneProject,
        },
      };
    } catch (error) {
      logger.error("Error in CourseService.validateCourseCompleteness:", error);
      throw error;
    }
  }

  /**
   * Publishes a course after validating its completeness.
   * Sets `publish: true` and `draft: false`. Fails if chapters, lessons, or capstone are missing.
   * @param courseId - The Firestore document ID of the course.
   * @returns The updated course document.
   * @throws {AppError} 400 if the course is incomplete.
   */
  public async publishCourse(courseId: string): Promise<Course> {
    try {
      const validation = await this.validateCourseCompleteness(courseId);

      if (!validation.isComplete) {
        throw new AppError(
          `Cannot publish course. Missing: ${validation.missingComponents.join(
            ", ",
          )}`,
          400,
        );
      }

      await this.courseRepository.updateCourse(courseId, {
        publish: true,
        draft: false,
      });

      return await this.courseRepository.getCourseById(courseId);
    } catch (error) {
      logger.error("Error in CourseService.publishCourse:", error);
      throw error;
    }
  }

  /**
   * Unpublishes a course, setting `publish: false` while keeping draft status unchanged.
   * @param courseId - The Firestore document ID of the course.
   * @returns The updated course document.
   */
  public async unpublishCourse(courseId: string): Promise<Course> {
    try {
      await this.courseRepository.updateCourse(courseId, { publish: false });
      return await this.courseRepository.getCourseById(courseId);
    } catch (error) {
      logger.error("Error in CourseService.unpublishCourse:", error);
      throw error;
    }
  }

  /**
   * Moves a course back to draft status, also unpublishing it.
   * Sets `draft: true` and `publish: false`.
   * @param courseId - The Firestore document ID of the course.
   * @returns The updated course document.
   */
  public async draftCourse(courseId: string): Promise<Course> {
    try {
      await this.courseRepository.updateCourse(courseId, {
        draft: true,
        publish: false,
      });
      return await this.courseRepository.getCourseById(courseId);
    } catch (error) {
      logger.error("Error in CourseService.draftCourse:", error);
      throw error;
    }
  }

  /**
   * Removes draft status from a course without publishing it.
   * Sets `draft: false` while keeping `publish` unchanged.
   * @param courseId - The Firestore document ID of the course.
   * @returns The updated course document.
   */
  public async undraftCourse(courseId: string): Promise<Course> {
    try {
      await this.courseRepository.updateCourse(courseId, { draft: false });
      return await this.courseRepository.getCourseById(courseId);
    } catch (error) {
      logger.error("Error in CourseService.undraftCourse:", error);
      throw error;
    }
  }

  /**
   * Generates course metadata via Gemini AI without persisting it.
   * Used as the first step in a staged generation pipeline (e.g. generate course → chapters → lessons → batch commit).
   * Doesnt support streaming
   * Deduplicates the course name if one already exists for the user.
   * @param request - Generation parameters (topic, category, level, duration, chapters, language, uid).
   * @returns The generated course data (without an ID) ready for staging.
   */
  public async generateCourseData(
    request: GenerateCourseRequest,
  ): Promise<Omit<Course, "id">> {
    try {
      const promptMode: CoursePromptMode = request.promptMode ?? "system";
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

      const result = await geminiCall(userPrompt, {
        responseSchema: courseSchema,
        temperature: 0.4,
        maxRetries: 3,
        systemPrompt,
        benchmarkTag: `course:${promptMode}`,
        metadata: {
          topic: request.topic,
          level: request.level,
        },
      });

      logger.info("Course data generated (staged)", {
        mode: promptMode,
        topic: request.topic,
        uid: request.uid,
        name: result?.name,
      });

      const courseData: Omit<Course, "id"> = {
        ...result,
        uid: request.uid,
        publish: false,
        draft: true,
      };

      const nameExist = await this.courseRepository.courseNameExists(
        courseData.name,
        courseData.uid,
      );

      if (nameExist) {
        courseData.name = `${courseData.name} (${Date.now()})`;
      }

      return courseData;
    } catch (error) {
      logger.error("Error in CourseService.generateCourseData:", error);
      throw error;
    }
  }

  /**
   * Streaming variant of generateCourseData.
   * Pipes raw Gemini tokens to `onChunk` for real-time client display,
   * then parses the full response, deduplicates the name, and returns staged course data.
   * @param request - Generation parameters.
   * @param onChunk - Callback invoked with each streamed token.
   * @returns The generated course data (without an ID) ready for staging.
   */
  public async generateCourseDataStreaming(
    request: GenerateCourseRequest,
    onChunk: (chunk: string) => void,
  ): Promise<Omit<Course, "id">> {
    try {
      const promptMode: CoursePromptMode = request.promptMode ?? "system";
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
        temperature: 0.4,
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

      const courseData: Omit<Course, "id"> = {
        ...parsed,
        uid: request.uid,
        publish: false,
        draft: true,
      };

      const nameExist = await this.courseRepository.courseNameExists(
        courseData.name,
        courseData.uid,
      );

      if (nameExist) {
        courseData.name = `${courseData.name} (${Date.now()})`;
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

  /**
   * Atomically persists a fully staged course along with its chapters and lessons.
   * Uses Firestore batch writes to ensure all-or-nothing semantics.
   * @param staged - The complete staged data containing the course, chapters, and their lessons.
   * @returns The created course with its Firestore-generated ID.
   */
  public async createCourseWithRelations(
    staged: StagedCourseData,
  ): Promise<CourseCreationResult> {
    try {
      return await this.courseRepository.createCourseWithRelations(staged);
    } catch (error) {
      logger.error("Error in CourseService.createCourseWithRelations:", error);
      throw error;
    }
  }
}
