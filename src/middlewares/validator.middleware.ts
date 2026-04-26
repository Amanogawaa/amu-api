/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "./auth.middleware";

import { CourseRepository } from "modules/course";
import { geminiCall } from "core/ai/geminiCall";
import {
  createGenerationJobId,
  emitValidationProgress,
} from "core/helper/generation.helpers";
import {
  SIMILARITY_CONFIG,
  isDuplicateCourse,
} from "core/helper/similarity.helpers";
import { logger } from "core/utils/loggers";

interface ValidationResult {
  isValid: boolean;
  isProgramming: boolean;
  isAppropriate: boolean;
  reason?: string;
}

const VALIDATION_CACHE_TTL_MS = 10 * 60 * 1000;
const VALIDATION_TIMEOUT_MS = 8_000;
const validationCache = new Map<
  string,
  { result: ValidationResult; expiresAt: number }
>();

const PROGRAMMING_KEYWORDS = [
  "programming",
  "coding",
  "software",
  "developer",
  "javascript",
  "typescript",
  "python",
  "java",
  "react",
  "node",
  "api",
  "database",
  "sql",
  "docker",
  "devops",
  "machine learning",
  "ai",
  "web development",
];

const NON_PROGRAMMING_KEYWORDS = [
  "cooking",
  "recipe",
  "sports",
  "history",
  "politics",
  "fitness",
  "yoga",
  "travel",
  "fashion",
  "gardening",
];

const HARMFUL_KEYWORDS = [
  "ransomware",
  "malware",
  "ddos",
  "credential stealing",
  "phishing",
  "data theft",
  "virus",
];

function normalizeValidationInput(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

function getCachedValidation(input: string): ValidationResult | null {
  const key = normalizeValidationInput(input);
  const cached = validationCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    validationCache.delete(key);
    return null;
  }
  return cached.result;
}

function setCachedValidation(input: string, result: ValidationResult): void {
  const key = normalizeValidationInput(input);
  validationCache.set(key, {
    result,
    expiresAt: Date.now() + VALIDATION_CACHE_TTL_MS,
  });
}

function runFastLocalValidation(input: string): ValidationResult | null {
  const normalized = normalizeValidationInput(input);
  if (!normalized) {
    return {
      isValid: false,
      isProgramming: false,
      isAppropriate: false,
      reason: "Topic is required",
    };
  }

  if (normalized.length < 3 || normalized.length > 800) {
    return {
      isValid: false,
      isProgramming: false,
      isAppropriate: false,
      reason: "Topic length is out of allowed range",
    };
  }

  if (HARMFUL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return {
      isValid: false,
      isProgramming: false,
      isAppropriate: false,
      reason: "Request contains harmful or malicious intent",
    };
  }

  const hasProgrammingKeyword = PROGRAMMING_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );
  const hasNonProgrammingKeyword = NON_PROGRAMMING_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );

  if (hasProgrammingKeyword && !hasNonProgrammingKeyword) {
    return {
      isValid: true,
      isProgramming: true,
      isAppropriate: true,
      reason: "Passed local programming relevance check",
    };
  }

  if (hasNonProgrammingKeyword && !hasProgrammingKeyword) {
    return {
      isValid: false,
      isProgramming: false,
      isAppropriate: true,
      reason: "Request is not programming related",
    };
  }

  return null;
}

const validationResultSchema = {
  type: "object",
  properties: {
    isProgramming: { type: "boolean" },
    isAppropriate: { type: "boolean" },
    reason: { type: "string" },
  },
  required: ["isProgramming", "isAppropriate"],
};

async function validateContentAndTopic(
  input: string,
): Promise<ValidationResult> {
  const cached = getCachedValidation(input);
  if (cached) {
    return cached;
  }

  const localValidation = runFastLocalValidation(input);
  if (localValidation) {
    setCachedValidation(input, localValidation);
    return localValidation;
  }

  const prompt = `
You are a content validator for an educational programming course platform.

Your task is to validate the user's course request on TWO criteria:

1. CONTENT SAFETY - Check if the request contains inappropriate, harmful, or malicious content.
2. TOPIC RELEVANCE - Check if the request is about programming, coding, software development, web dev, data science, AI/ML, DevOps, or any technical computing skill.

REJECT if the request involves: 
- Illegal activities (hacking into systems without permission, creating malware, ransomware, viruses)
- Harmful code (DDoS attacks, data theft, credential stealing, unauthorized access)
- Exploits for malicious purposes (SQL injection for data theft, XSS for attacks)
- Violence, hate speech, discrimination, harassment
- Sexual or adult content
- Scams, fraud, or deceptive practices
- Privacy violations or surveillance without consent
- Non-programming topics (cooking, history, sports, etc.)

ACCEPT legitimate educational content like:
- Ethical hacking and cybersecurity education
- Security testing and penetration testing (for defense)
- Understanding vulnerabilities for protection
- Secure coding practices
- Defensive programming techniques
- Any programming language, framework, or tech stack
- Web development, mobile development, data science, AI/ML, DevOps, Game Development

Return ONLY a JSON object with this exact format:
{"isProgramming": true/false, "isAppropriate": true/false, "reason": "short reason"}

Now validate:
"${input}"
`;
  try {
    const result = await Promise.race([
      geminiCall(prompt, {
        stream: false,
        responseSchema: validationResultSchema,
        temperature: 0.2,
        maxRetries: 3,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Validation service timeout")),
          VALIDATION_TIMEOUT_MS,
        );
      }),
    ]);

    const isProgramming =
      result.isProgramming === true || result.is_programming === "true";
    const isAppropriate =
      result.isAppropriate === true || result.is_appropriate === "true";
    const isValid = isProgramming && isAppropriate;

    logger.log("Content validation JSON:", result);

    const validationResult = {
      isValid,
      isProgramming,
      isAppropriate,
      reason: result.reason,
    };
    setCachedValidation(input, validationResult);
    return validationResult;
  } catch (error) {
    logger.error("Content validation error:", error);
    const fallback = {
      isValid: false,
      isProgramming: false,
      isAppropriate: false,
      reason: "Validation failed",
    };
    setCachedValidation(input, fallback);
    return fallback;
  }
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

    const validation = await validateContentAndTopic(fullText);

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
