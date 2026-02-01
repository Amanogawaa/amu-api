import { AppError } from "../../utils/errors";
import { logger } from "../../utils/loggers";
import {
  buildCoursePrompt,
  type CoursePromptMode,
} from "../../utils/prompts/course-temp";
import { CourseRepository } from "./repository";
import type { StagedCourseData } from "../../utils/service/generation.service";

import { geminiCall } from "../../utils/geminiCall";
import {
  type Course,
  type CourseQueryParams,
  type GenerateCourseRequest,
  courseSchema,
} from "./types";

export class CourseService {
  private courseRepository: CourseRepository;

  constructor(courseRepository: CourseRepository) {
    this.courseRepository = courseRepository;
  }

  public async getCourses(params?: CourseQueryParams): Promise<Course[]> {
    try {
      const courses = await this.courseRepository.getCourse(params);
      return courses;
    } catch (error) {
      logger.error("Error in CoursesService.getCourses:", error);
      throw error;
    }
  }

  public async getCourseById(slug: string): Promise<Course> {
    try {
      const course = await this.courseRepository.getCourseById(slug);
      return course;
    } catch (error) {
      logger.error("Error in CoursesService.getCourseById:", error);
      throw error;
    }
  }

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
        temperature: 0.7,
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

  public async generateCourseStream(
    request: GenerateCourseRequest,
    socketId: string,
    emitChunk: (socketId: string, chunk: string) => void,
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
        temperature: 0.7,
        maxRetries: 3,
        systemPrompt,
        stream: true,
        onChunk: async (chunk: string) => {
          fullResponse += chunk;
          emitChunk(socketId, chunk);
        },
        benchmarkTag: `course:${promptMode}:stream`,
        metadata: {
          topic: request.topic,
          level: request.level,
        },
      });

      let parsedCourse;
      try {
        parsedCourse = JSON.parse(fullResponse);
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

  public async deleteCourse(courseId: string): Promise<void> {
    try {
      await this.courseRepository.deleteCourse(courseId);
    } catch (error) {
      logger.error("Error in CoursesService.deleteCourse:", error);
      throw error;
    }
  }

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

  public async unpublishCourse(courseId: string): Promise<Course> {
    try {
      await this.courseRepository.updateCourse(courseId, { publish: false });
      return await this.courseRepository.getCourseById(courseId);
    } catch (error) {
      logger.error("Error in CourseService.unpublishCourse:", error);
      throw error;
    }
  }

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

  public async undraftCourse(courseId: string): Promise<Course> {
    try {
      await this.courseRepository.updateCourse(courseId, { draft: false });
      return await this.courseRepository.getCourseById(courseId);
    } catch (error) {
      logger.error("Error in CourseService.undraftCourse:", error);
      throw error;
    }
  }

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
        temperature: 0.7,
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

  public async createCourseWithRelations(
    staged: StagedCourseData,
  ): Promise<Course> {
    try {
      return await this.courseRepository.createCourseWithRelations(staged);
    } catch (error) {
      logger.error("Error in CourseService.createCourseWithRelations:", error);
      throw error;
    }
  }
}
