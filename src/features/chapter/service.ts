import { geminiCall } from "../../utils/geminiCall";
import { logger } from "../../utils/loggers";
import {
  buildChaptersPrompt,
  type ChapterPromptMode,
} from "../../utils/prompts/chapter-temp";
import { ChapterRepository } from "./repository";
import { chaptersSchema, type GenerateChaptersRequest } from "./types";

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

  public async deleteChaptersByCourseId(courseId: string) {
    try {
      await this.chapterRepository.deleteChaptersByCourseId(courseId);
    } catch (error) {
      logger.error("Error in ChapterService.deleteChaptersByCourseId:", error);
      throw error;
    }
  }
}
