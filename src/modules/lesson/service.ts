import { geminiCall } from "../../core/ai/geminiCall";
import { logger } from "../../core/utils/loggers";
import {
  buildLessonsPrompt,
  type LessonPromptMode,
} from "../../core/ai/prompts/lesson-temp";
import { LessonRepository } from "./repository";
import {
  lessonsSchema,
  type GenerateLessonRequest,
  type Lesson,
} from "./types";
import { backgroundJobService } from "../../core/service/background-job.service";
import { youtubeService } from "../../core/service/youtube.service";
import { youtubeTranscriptService } from "../../core/service/youtube-transcript.service";
import type { QuizService } from "../quiz/service";

export class LessonService {
  private lessonRepository: LessonRepository;
  private quizService?: QuizService;

  constructor(lessonRepository: LessonRepository, quizService?: QuizService) {
    this.lessonRepository = lessonRepository;
    this.quizService = quizService;
  }

  private getQuizContextLimits(): {
    maxTotalChars: number;
    maxCharsPerLesson: number;
    maxCharsPerTranscript: number;
  } {
    const readNum = (key: string, fallback: number) => {
      const raw = process.env[key];
      if (!raw) return fallback;
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };

    return {
      maxTotalChars: readNum("QUIZ_CONTEXT_MAX_TOTAL_CHARS", 18_000),
      maxCharsPerLesson: readNum("QUIZ_CONTEXT_MAX_CHARS_PER_LESSON", 4_000),
      maxCharsPerTranscript: readNum(
        "QUIZ_CONTEXT_MAX_CHARS_PER_TRANSCRIPT",
        4_000,
      ),
    };
  }

  private truncateForQuizContext(
    text: string,
    maxChars: number,
    label: string,
  ): string {
    if (!text) return "";
    if (!maxChars || maxChars <= 0) return text;
    if (text.length <= maxChars) return text;

    const head = text.slice(0, Math.max(0, maxChars - 200));
    const tail = text.slice(Math.max(0, text.length - 120));
    return `${head}\n\n[...truncated ${label}: ${text.length - head.length - tail.length} chars...]\n\n${tail}`;
  }

  private buildPreviousLessonsContextForQuiz(previousLessons: Lesson[]): {
    context: string;
    stats: Record<string, unknown>;
  } {
    const limits = this.getQuizContextLimits();

    // Prefer most recent lessons closest to the quiz.
    const ordered = [...previousLessons].sort(
      (a, b) => b.lessonOrder - a.lessonOrder,
    );

    let combined = "";
    let includedLessons = 0;
    let droppedLessons = 0;
    let totalRawChars = 0;

    for (const lesson of ordered) {
      const header =
        `**Lesson ${lesson.lessonOrder}: ${lesson.lessonName}**\n` +
        `Description: ${lesson.lessonDescription}\n` +
        `Learning Outcome: ${lesson.learningOutcome}\n`;

      const rawContent = lesson.content ? String(lesson.content) : "";
      const rawTranscript = lesson.videoTranscript
        ? String(lesson.videoTranscript)
        : "";

      totalRawChars += header.length + rawContent.length + rawTranscript.length;

      const content = rawContent
        ? `Content:\n${this.truncateForQuizContext(
            rawContent,
            limits.maxCharsPerLesson,
            "lesson content",
          )}\n`
        : "";

      const transcript = rawTranscript
        ? `Transcript:\n${this.truncateForQuizContext(
            rawTranscript,
            limits.maxCharsPerTranscript,
            "transcript",
          )}\n`
        : "";

      const block = `${header}${content}${transcript}`.trim();
      if (!block) continue;

      const separator = combined ? "\n\n---\n\n" : "";
      const candidate = `${combined}${separator}${block}`;

      if (candidate.length > limits.maxTotalChars) {
        droppedLessons += 1;
        continue;
      }

      combined = candidate;
      includedLessons += 1;
    }

    // Return in chronological order for readability (oldest -> newest)
    const context = combined
      ? combined.split("\n\n---\n\n").reverse().join("\n\n---\n\n")
      : "";

    return {
      context,
      stats: {
        maxTotalChars: limits.maxTotalChars,
        maxCharsPerLesson: limits.maxCharsPerLesson,
        maxCharsPerTranscript: limits.maxCharsPerTranscript,
        previousLessonsCount: previousLessons.length,
        includedLessons,
        droppedLessons,
        totalRawChars,
        finalChars: context.length,
      },
    };
  }

  public async getLessons(chapterId: string) {
    try {
      const lessons = await this.lessonRepository.getLessons(chapterId);
      return lessons;
    } catch (error) {
      logger.error("Error in LessonService.getLessons:", error);
      throw error;
    }
  }

  public async generateLessons(request: GenerateLessonRequest) {
    try {
      const promptMode: LessonPromptMode = request.promptMode ?? "system";
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
        temperature: 0.4,
        maxRetries: 3,
        systemPrompt,
        benchmarkTag: `lessons:${promptMode}`,
        metadata: {
          chapterId: request.chapterId,
          courseName: request.courseName,
        },
      });

      logger.info("Lessons generated via Gemini", {
        chapterId: request.chapterId,
        mode: promptMode,
        lessonCount: result?.lessons?.length ?? 0,
      });

      if (!result.lessons || !Array.isArray(result.lessons)) {
        throw new Error("Invalid response from Gemini: missing lessons array");
      }

      // Get courseId from chapter for proper lesson linking
      const chapter = await this.lessonRepository["firebaseStore"]
        .collection("chapters")
        .doc(request.chapterId)
        .get();
      const courseId = chapter.exists ? chapter.data()?.courseId : undefined;

      const createdLessons = await this.lessonRepository.createLessons(
        request.chapterId,
        result.lessons,
        courseId,
      );

      logger.info(`Successfully created ${createdLessons.length} lessons`);

      backgroundJobService.enqueue(
        `lesson:${request.chapterId}:transcripts`,
        () => this.autoFetchTranscriptsForVideoLessons(createdLessons),
      );

      backgroundJobService.enqueue(`lesson:${request.chapterId}:quizzes`, () =>
        this.autoGenerateQuizzes(createdLessons, request.chapterId),
      );

      return createdLessons;
    } catch (error) {
      logger.error("Error in LessonService.generateLessons:", error);
      throw error;
    }
  }

  private async autoFetchTranscriptsForVideoLessons(
    lessons: Lesson[],
  ): Promise<void> {
    logger.info("Starting auto-fetch transcripts for video lessons...");

    for (const lesson of lessons) {
      if (lesson.type === "video" && lesson.videoSearchQuery) {
        try {
          logger.info(
            `Fetching video and transcript for lesson: ${lesson.lessonName}`,
          );

          const videos = await youtubeService.searchVideos(
            lesson.videoSearchQuery,
            1,
          );

          if (videos.videos.length === 0) {
            logger.warn(
              `No videos found for lesson ${lesson.id}: ${lesson.videoSearchQuery}`,
            );
            continue;
          }

          const topVideo = videos.videos[0];

          if (!topVideo) {
            logger.warn(`No valid video found for lesson ${lesson.id}`);
            continue;
          }

          logger.info(
            `Selected video: ${topVideo.title} (${topVideo.videoId})`,
          );

          const transcript = await youtubeTranscriptService.getTranscript(
            topVideo.videoId,
          );

          if (transcript) {
            await this.updateLesson(lesson.id, {
              selectedVideoId: topVideo.videoId,
              content: transcript.fullText,
              videoTranscript: transcript.fullText,
              transcriptLanguage: transcript.language,
              transcriptFetchedAt: new Date().toISOString(),
            });

            const stats =
              youtubeTranscriptService.getTranscriptStats(transcript);
            logger.info(
              `✅ Transcript fetched for lesson ${lesson.id}: ${stats.wordCount} words, ${stats.duration}s duration`,
            );
          } else {
            logger.warn(
              `No transcript available for video ${topVideo.videoId} (lesson ${lesson.id})`,
            );

            await this.updateLesson(lesson.id, {
              selectedVideoId: topVideo.videoId,
            });
          }
        } catch (error) {
          logger.error(
            `Failed to fetch transcript for lesson ${lesson.id}:`,
            error,
          );
        }
      }
    }

    logger.info("Completed auto-fetch transcripts");
  }

  private async autoGenerateQuizzes(
    lessons: Lesson[],
    chapterId: string,
  ): Promise<void> {
    logger.info("🚀 [QUIZ DEBUG] autoGenerateQuizzes called", {
      chapterId,
      lessonsCount: lessons.length,
      lessonTypes: lessons.map((l) => l.type),
    });

    if (!this.quizService) {
      logger.error("❌ [QUIZ DEBUG] Quiz service not available!", {
        chapterId,
      });
      return;
    }

    logger.info("✅ [QUIZ DEBUG] Quiz service is available", {
      chapterId,
    });

    logger.info("Starting auto-generation of quizzes for quiz lessons...", {
      chapterId,
      totalLessonsPassedIn: lessons.length,
    });

    const quizLessons = lessons.filter((lesson) => lesson.type === "quiz");
    logger.info("🔍 [QUIZ DEBUG] Filtered quiz lessons", {
      chapterId,
      totalLessonsIn: lessons.length,
      quizLessonsOut: quizLessons.length,
      quizLessonIds: quizLessons.map((l) => l.id),
    });

    if (quizLessons.length === 0) {
      logger.warn("⚠️ [QUIZ DEBUG] No quiz lessons found!", {
        chapterId,
        lessonCount: lessons.length,
        lessonTypes: lessons.map((l) => l.type),
      });
      return;
    }

    logger.info("📚 [QUIZ DEBUG] Fetching ALL lessons from repository...", {
      chapterId,
    });

    const allLessons = await this.lessonRepository.getLessons(chapterId);
    logger.info("📦 [QUIZ DEBUG] Fetched lessons from repository", {
      chapterId,
      passedInLessonCount: lessons.length,
      fetchedLessonCount: allLessons.length,
      fetchedLessonTypes: allLessons.map((l) => ({
        id: l.id,
        type: l.type,
        order: l.lessonOrder,
      })),
    });
    const sortedLessons = allLessons.sort(
      (a, b) => a.lessonOrder - b.lessonOrder,
    );

    for (const quizLesson of quizLessons) {
      try {
        logger.info(
          `Generating quiz for lesson: ${quizLesson.lessonName} (order: ${quizLesson.lessonOrder})`,
          {
            chapterId,
            lessonId: quizLesson.id,
            lessonOrder: quizLesson.lessonOrder,
          },
        );

        const previousLessons = sortedLessons.filter(
          (lesson) =>
            lesson.lessonOrder < quizLesson.lessonOrder &&
            lesson.type !== "quiz",
        );

        logger.info("🔎 [QUIZ DEBUG] Filtered previous lessons", {
          chapterId,
          quizLessonId: quizLesson.id,
          quizLessonOrder: quizLesson.lessonOrder,
          previousLessonCount: previousLessons.length,
        });

        if (previousLessons.length === 0) {
          logger.warn(
            `No previous lessons found for quiz ${quizLesson.id}, skipping`,
            {
              chapterId,
              quizLessonId: quizLesson.id,
              quizLessonOrder: quizLesson.lessonOrder,
              totalLessonsInChapter: sortedLessons.length,
            },
          );
          continue;
        }

        const previousLessonsContent = previousLessons
          ? this.buildPreviousLessonsContextForQuiz(previousLessons)
          : { context: "", stats: {} };

        logger.info("Built previous lessons context for quiz generation", {
          chapterId,
          quizLessonId: quizLesson.id,
          ...previousLessonsContent.stats,
        });

        let difficulty: "easy" | "medium" | "hard" = "medium";
        if (quizLesson.lessonOrder <= 3) {
          difficulty = "easy";
        } else if (quizLesson.lessonOrder >= 7) {
          difficulty = "hard";
        }

        try {
          logger.info("🤖 [QUIZ DEBUG] Calling quizService.generateQuiz", {
            chapterId,
            quizLessonId: quizLesson.id,
            lessonName: quizLesson.lessonName,
            difficulty,
            previousLessonCount: previousLessons.length,
          });

          const quiz = await this.quizService.generateQuiz({
            lessonId: quizLesson.id,
            lessonName: quizLesson.lessonName,
            previousLessonsContent: previousLessonsContent.context,
            numberOfQuestions: Math.min(previousLessons.length * 5, 10),
            difficulty,
          });

          logger.info("✅ [QUIZ DEBUG] Quiz generated successfully", {
            chapterId,
            quizLessonId: quizLesson.id,
            quizId: quiz.id,
            questionCount: quiz.questions.length,
            difficulty,
          });
        } catch (error) {
          logger.error("❌ [QUIZ DEBUG] QuizService.generateQuiz FAILED", {
            chapterId,
            quizLessonId: quizLesson.id,
            lessonName: quizLesson.lessonName,
            error:
              error instanceof Error ? error.message : JSON.stringify(error),
            errorStack: error instanceof Error ? error.stack : undefined,
          });
          throw error;
        }
      } catch (error) {
        logger.error(
          `Failed to generate quiz for lesson ${quizLesson.id}:`,
          error,
        );
      }
    }

    logger.info("Completed auto-generation of quizzes");
  }

  public async getLessonById(lessonId: string) {
    try {
      const lesson = await this.lessonRepository.getLessonById(lessonId);
      if (!lesson) {
        throw new Error("Lesson not found");
      }
      return lesson;
    } catch (error) {
      logger.error("Error in LessonService.getLessonById:", error);
      throw error;
    }
  }

  public async updateLesson(
    lessonId: string,
    lessonData: Partial<Omit<Lesson, "id" | "chapterId" | "createdAt">>,
  ) {
    try {
      const updatedLesson = await this.lessonRepository.updateLesson(
        lessonId,
        lessonData,
      );
      return updatedLesson;
    } catch (error) {
      logger.error("Error in LessonService.updateLesson:", error);
      throw error;
    }
  }

  public async deleteLesson(lessonId: string) {
    try {
      await this.lessonRepository.deleteLesson(lessonId);
    } catch (error) {
      logger.error("Error in LessonService.deleteLesson:", error);
      throw error;
    }
  }

  public async generateLessonsData(
    request: GenerateLessonRequest,
  ): Promise<Array<Omit<Lesson, "id" | "chapterId">>> {
    try {
      const promptMode: LessonPromptMode = request.promptMode ?? "system";
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
        temperature: 0.4,
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

  /**
   * Streaming variant of generateLessonsData.
   * Pipes raw Gemini tokens to `onChunk` for real-time display,
   * then parses the accumulated response and returns the lessons array (staged, not saved).
   * @param request - Lesson generation request.
   * @param onChunk - Callback invoked with each streamed token.
   * @returns Array of lesson data ready for staging.
   */
  public async generateLessonsDataStreaming(
    request: GenerateLessonRequest,
    onChunk: (chunk: string) => void,
  ): Promise<Array<Omit<Lesson, "id" | "chapterId">>> {
    try {
      const promptMode: LessonPromptMode = request.promptMode ?? "system";
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
        temperature: 0.4,
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
