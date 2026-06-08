/* eslint-disable @typescript-eslint/no-explicit-any */
import { geminiCall } from "@utils/geminiCall";
import { logger } from "@utils/loggers";
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "./auth.middleware";
import {
  emitValidationProgress,
  createGenerationJobId,
} from "@utils/helper/generation.helpers";
import { CourseRepository } from "@features/course";
import {
  SIMILARITY_CONFIG,
  isDuplicateCourse,
} from "@utils/helper/similarity.helpers";

const PROGRAMMING_KEYWORDS = [
  "python",
  "javascript",
  "typescript",
  "react",
  "vue",
  "angular",
  "node",
  "java",
  "c++",
  "c#",
  "rust",
  "go",
  "swift",
  "kotlin",
  "ruby",
  "php",
  "sql",
  "mongodb",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "git",
  "html",
  "css",
  "api",
  "rest",
  "graphql",
  "webpack",
  "vite",
  "machine learning",
  "deep learning",
  "ai",
  "data science",
  "tensorflow",
  "pytorch",
  "pandas",
  "numpy",
  "devops",
  "cicd",
  "linux",
  "bash",
  "algorithm",
  "data structure",
  "oop",
  "functional programming",
  "web development",
  "mobile development",
  "game development",
  "flutter",
  "django",
  "flask",
  "express",
  "nextjs",
  "nuxt",
  "spring",
  "laravel",
  "solidjs",
  "ai automation",
  "cybersecurity",
  // ... extend as needed
];
const BLOCKED_KEYWORDS = [
  "malware",
  "ransomware",
  "ddos",
  "credential stealing",
  "keylogger",
  "phishing kit",
  "exploit kit",
  "botnet",
  "trojan",
  "hacking",
  "how to hack",
  "how to create malware",
  "how to create virus",
  // ... extend as needed
];

interface ValidationResult {
  isValid: boolean;
  isProgramming: boolean;
  isAppropriate: boolean;
  reason?: string;
  source: "local" | "cache" | "ai";
}

// --- In-memory validation cache ---
const validationCache = new Map<string, ValidationResult>();
const CACHE_MAX_SIZE = 500;

function getCacheKey(input: string): string {
  return input.toLowerCase().trim();
}

function getCachedValidation(input: string): ValidationResult | null {
  const key = getCacheKey(input);
  const cached = validationCache.get(key);
  if (cached) {
    logger.info(`Validation cache hit for: "${key.slice(0, 50)}..."`);
    return { ...cached, source: "cache" };
  }
  return null;
}

function setCachedValidation(input: string, result: ValidationResult): void {
  const key = getCacheKey(input);
  // Evict oldest entry if cache is full
  if (validationCache.size >= CACHE_MAX_SIZE) {
    const firstKey = validationCache.keys().next().value;
    if (firstKey) validationCache.delete(firstKey);
  }
  validationCache.set(key, result);
}

// --- Local keyword-based validation (0 tokens) ---
function localValidate(
  input: string,
): { result: ValidationResult } | { ambiguous: true } {
  const lower = input.toLowerCase();

  // Check blocklist first — immediate reject
  const blockedMatch = BLOCKED_KEYWORDS.find((kw) => lower.includes(kw));
  if (blockedMatch) {
    logger.info(`Local validation: blocked keyword "${blockedMatch}"`);
    return {
      result: {
        isValid: false,
        isProgramming: false,
        isAppropriate: false,
        reason: `Contains blocked content: "${blockedMatch}"`,
        source: "local",
      },
    };
  }

  // Check if any programming keyword matches — immediate accept
  const programmingMatch = PROGRAMMING_KEYWORDS.find((kw) =>
    lower.includes(kw),
  );
  if (programmingMatch) {
    logger.info(
      `Local validation: programming keyword "${programmingMatch}" matched`,
    );
    return {
      result: {
        isValid: true,
        isProgramming: true,
        isAppropriate: true,
        reason: `Matched programming keyword: "${programmingMatch}"`,
        source: "local",
      },
    };
  }

  // No keyword matched either list — ambiguous, needs AI
  logger.info("Local validation: ambiguous input, falling back to AI");
  return { ambiguous: true };
}

// --- Compact AI validation fallback (minimal tokens) ---
const compactValidationSchema = {
  type: "object",
  properties: {
    p: { type: "boolean" },
    a: { type: "boolean" },
    r: { type: "string" },
  },
  required: ["p", "a"],
};

async function compactAIValidation(input: string): Promise<ValidationResult> {
  const prompt = `Classify this course topic. Reply JSON {"p":bool,"a":bool,"r":"reason"}
p=programming/tech related, a=appropriate(no malware/illegal/violence/adult)
Topic: "${input}"`;

  try {
    const result = await geminiCall(prompt, {
      stream: false,
      responseSchema: compactValidationSchema,
      temperature: 0,
      maxRetries: 2,
    });

    const isProgramming = result.p === true;
    const isAppropriate = result.a === true;

    logger.log("Compact AI validation result:", result);

    return {
      isValid: isProgramming && isAppropriate,
      isProgramming,
      isAppropriate,
      reason: result.r,
      source: "ai",
    };
  } catch (error) {
    logger.error("Compact AI validation error:", error);
    return {
      isValid: false,
      isProgramming: false,
      isAppropriate: false,
      reason: "AI validation failed",
      source: "ai",
    };
  }
}

// --- Hybrid validation: local → cache → compact AI ---
async function validateInput(input: string): Promise<ValidationResult> {
  // 1. Try local keyword validation (0 tokens, instant)
  const local = localValidate(input);
  if ("result" in local) {
    setCachedValidation(input, local.result);
    return local.result;
  }

  // 2. Check cache (0 tokens)
  const cached = getCachedValidation(input);
  if (cached) return cached;

  // 3. Fall back to compact AI call (minimal tokens)
  const aiResult = await compactAIValidation(input);
  setCachedValidation(input, aiResult);
  return aiResult;
}

export const validateCourseTopic = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { topic, userInstructions } = req.body;

    const fullText = `${topic} ${userInstructions || ""}`.trim();

    if (!fullText) {
      return res.status(400).json({
        error: "Topic is required and cannot be empty",
      });
    }

    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.uid) {
      const jobId = createGenerationJobId();
      const startTime = new Date().toISOString();

      (req as any).generationJobId = jobId;
      (req as any).generationStartTime = startTime;

      emitValidationProgress(authReq, jobId, authReq.user.uid);
    }

    const validation = await validateInput(fullText);

    logger.info(`Validation resolved via: ${validation.source}`);

    if (!validation.isAppropriate) {
      logger.warn(`Inappropriate content detected: ${fullText}`);
      return res.status(400).json({
        error:
          "Content policy violation: Request contains inappropriate or harmful content.",
        details:
          validation.reason ||
          "Your request appears to involve malicious, illegal, or harmful activities.",
      });
    }

    if (!validation.isProgramming) {
      return res.status(400).json({
        error:
          "Invalid request: Only programming-related courses are supported.",
        details:
          validation.reason ||
          "Examples of valid topics: Python, React, Docker, Machine Learning, SQL, etc.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkDuplicateCourse = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { topic, level, category } = req.body;
    const authReq = req as AuthenticatedRequest;
    const uid = authReq.user?.uid;

    if (!uid) {
      return next();
    }

    if (!SIMILARITY_CONFIG.CHECK_ENABLED) {
      logger.info("Duplicate course check is disabled in config");
      return next();
    }

    const courseRepository = new CourseRepository();
    const existingCourses = await courseRepository.getCourse({ uid });

    console.log("Existing courses", existingCourses);

    if (existingCourses.length === 0) {
      logger.info(
        "No existing courses found for user, skipping duplicate check",
      );
      return next();
    }

    const duplicateCheck = isDuplicateCourse(
      existingCourses,
      topic,
      level,
      category,
      0.85,
    );

    console.log("Duplicate check", duplicateCheck);

    if (duplicateCheck.isDuplicate && duplicateCheck.similarCourse) {
      const { similarCourse, score, reason } = duplicateCheck;

      logger.warn(
        `Duplicate course detected for user ${uid}: ${similarCourse.name} (${Math.round((score || 0) * 100)}% similar)`,
      );

      return res.status(409).json({
        error: "Similar course already exists",
        message:
          "You already have a course with similar content. Consider continuing with the existing course instead of creating a duplicate.",
        existingCourse: {
          id: similarCourse.id,
          name: similarCourse.name,
          topic: similarCourse.topic,
          level: similarCourse.level,
          category: similarCourse.category,
          duration: similarCourse.duration,
          createdAt: similarCourse.createdAt,
        },
        similarityScore: Math.round((score || 0) * 100),
        reason: reason || "Similar content detected",
        suggestion:
          "If you want to learn at a different level, try changing the difficulty. Otherwise, you can continue with your existing course.",
      });
    }

    logger.info("No duplicate course found, proceeding with generation");
    next();
  } catch (error) {
    logger.error("Error in duplicate course check:", error);
    next();
  }
};
