import { geminiCall } from "../../utils/geminiCall";
import { logger } from "../../utils/loggers";
import {
  buildChaptersPrompt,
  buildSingleChapterPrompt,
  type ChapterPromptMode,
} from "../../utils/prompts/chapter-temp";
import { ChapterRepository } from "./repository";
import {
  chaptersSchema,
  singleChapterSchema,
  type Chapter,
  type GenerateChaptersRequest,
  type GenerateSingleChapterRequest,
} from "./types";

export class ChapterService {
  private chapterRepository: ChapterRepository;

  constructor(chapterRepository: ChapterRepository) {
    this.chapterRepository = chapterRepository;
  }

  public async getChapters(courseId: string) {
    try {
      const chapters = await this.chapterRepository.getChapters(courseId);
      return chapters;
    } catch (error) {
      logger.error("Error in ChapterService.getChapters:", error);
      throw error;
    }
  }

  public async getChapter(chapterId: string) {
    try {
      const chapter = await this.chapterRepository.getChapter(chapterId);
      return chapter;
    } catch (error) {
      logger.error("Error in ChapterService.getChapter:", error);
      throw error;
    }
  }

  public async deleteChaptersByCourseId(courseId: string) {
    try {
      await this.chapterRepository.deleteChaptersByCourseId(courseId);
    } catch (error) {
      logger.error("Error in ChapterService.deleteChaptersByCourseId:", error);
      throw error;
    }
  }

  // default chapter creation method for bulk generation flow (generateChapters)
  // course -> chapters (all chapters generated at once, then created in DB) -> lessons (all generated at once for each chapter)
  public async generateChapters(request: GenerateChaptersRequest) {
    try {
      const promptMode: ChapterPromptMode = request.promptMode ?? "system";
      const { userPrompt, systemPrompt } = buildChaptersPrompt(
        {
          courseName: request.courseName,
          courseId: request.courseId,
          noOfChapters: request.noOfChapters,
          duration: request.duration,
          description: request.description,
          learningOutcomes: request.learningOutcomes,
          skillsGained: request.skillsGained,
          prerequisites: request.prerequisites,
          level: request.level,
          language: request.language,
          userInstructions: request.userInstructions,
        },
        { mode: promptMode, intent: "generate" },
      );

      const result = await geminiCall(userPrompt, {
        responseSchema: chaptersSchema,
        temperature: 0.7,
        maxRetries: 3,
        systemPrompt,
        benchmarkTag: `chapters:${promptMode}`,
        metadata: {
          courseId: request.courseId,
          courseName: request.courseName,
        },
      });

      logger.info("Chapters generated via Gemini", {
        courseId: request.courseId,
        mode: promptMode,
        chapterCount: result?.chapters?.length ?? 0,
      });

      if (!result.chapters || !Array.isArray(result.chapters)) {
        throw new Error("Invalid response from Gemini: missing chapters array");
      }

      const createdChapters = await this.chapterRepository.createChapters(
        request.courseId,
        request.courseName,
        result.chapters,
      );

      logger.info(`Successfully created ${createdChapters} chapters`);
      return createdChapters;
    } catch (error) {
      logger.error("Error in ChapterService.generateChapter:", error);
      throw error;
    }
  }

  // new method chapter generation flow (generateSingleChapter)
  // course -> module 1 (generate chapter 1, saved in memory before saving in db) -> module 2 (generate chapter 2 with context from module 1, saved in memory before saving in db) -> ... -> module N
  // transactionally create each chapter immediately after generation to ensure data is saved and available as context for subsequent modules, instead of generating all chapters at once and then saving in batch at the end
  public async generateChaptersData(
    request: GenerateChaptersRequest,
  ): Promise<Array<Omit<Chapter, "id" | "courseId" | "courseName">>> {
    try {
      const promptMode: ChapterPromptMode = request.promptMode ?? "system";
      const { userPrompt, systemPrompt } = buildChaptersPrompt(
        {
          courseName: request.courseName,
          courseId: request.courseId,
          noOfChapters: request.noOfChapters,
          duration: request.duration,
          description: request.description,
          learningOutcomes: request.learningOutcomes,
          skillsGained: request.skillsGained,
          prerequisites: request.prerequisites,
          level: request.level,
          language: request.language,
          userInstructions: request.userInstructions,
        },
        { mode: promptMode, intent: "generate" },
      );

      const result = await geminiCall(userPrompt, {
        responseSchema: chaptersSchema,
        temperature: 0.7,
        maxRetries: 3,
        systemPrompt,
        benchmarkTag: `chapters:${promptMode}`,
        metadata: {
          courseName: request.courseName,
        },
      });

      logger.info("Chapters data generated (staged)", {
        mode: promptMode,
        chapterCount: result?.chapters?.length ?? 0,
      });

      if (!result.chapters || !Array.isArray(result.chapters)) {
        throw new Error("Invalid response from Gemini: missing chapters array");
      }

      return result.chapters;
    } catch (error) {
      logger.error("Error in ChapterService.generateChaptersData:", error);
      throw error;
    }
  }

  // ============================================
  // NEW: Sequential Single Chapter Generation (Legacy generateChapters unchanged)
  // ============================================

  /**
   * Generates a SINGLE chapter with context from previous modules
   * Used in sequential course generation flow
   * @param request - Single chapter generation request with context
   * @returns Created chapter
   */
  public async generateSingleChapter(
    request: GenerateSingleChapterRequest,
  ): Promise<Chapter> {
    try {
      const promptMode: ChapterPromptMode = request.promptMode ?? "system";

      const { userPrompt, systemPrompt } = buildSingleChapterPrompt(
        {
          courseName: request.courseName,
          courseDescription: request.courseDescription,
          moduleIndex: request.moduleIndex,
          totalModules: request.totalModules,
          previousModules: request.previousModules || [],
          level: request.level,
          language: request.language,
          duration: request.duration,
          learningOutcomes: request.learningOutcomes,
          skillsGained: request.skillsGained,
          prerequisites: request.prerequisites,
          userInstructions: request.userInstructions,
        },
        { mode: promptMode, intent: "generate" },
      );

      const result = await geminiCall(userPrompt, {
        responseSchema: singleChapterSchema,
        temperature: 0.7,
        maxRetries: 3,
        systemPrompt,
        benchmarkTag: `chapter-single:${promptMode}`,
        metadata: {
          courseId: request.courseId,
          moduleIndex: request.moduleIndex,
          totalModules: request.totalModules,
        },
      });

      logger.info("Single chapter generated via Gemini", {
        courseId: request.courseId,
        moduleIndex: request.moduleIndex,
        mode: promptMode,
        chapterName: result?.chapterName,
      });

      if (!result) {
        throw new Error("Invalid response from Gemini: missing chapter data");
      }

      // Create the single chapter in database
      const createdChapter = await this.chapterRepository.createSingleChapter(
        request.courseId,
        request.courseName,
        {
          chapterOrder: request.moduleIndex,
          chapterName: result.chapterName,
          chapterDescription: result.chapterDescription,
          estimatedDuration: result.estimatedDuration,
          learningObjectives: result.learningObjectives,
          keyTopics: result.keyTopics,
          prerequisites: result.prerequisites || [],
          practicalApplication: result.practicalApplication,
          estimatedLessonCount: result.estimatedLessonCount,
        },
        request.moduleIndex,
      );

      logger.info(
        `Successfully created single chapter (${request.moduleIndex + 1}/${request.totalModules})`,
        {
          chapterId: createdChapter.id,
          chapterName: createdChapter.chapterName,
        },
      );

      return createdChapter;
    } catch (error) {
      logger.error("Error in ChapterService.generateSingleChapter:", error);
      throw error;
    }
  }
}
