/* eslint-disable no-console */
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

interface ValidationResult {
  isValid: boolean;
  isProgramming: boolean;
  isAppropriate: boolean;
  reason?: string;
}

async function validateContentAndTopic(
  input: string,
): Promise<ValidationResult> {
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
    const result = await geminiCall(prompt, { stream: false });

    const isProgramming = result.isProgramming === true;
    const isAppropriate = result.isAppropriate === true;
    const isValid = isProgramming && isAppropriate;

    logger.log("Content validation JSON:", result);

    return {
      isValid,
      isProgramming,
      isAppropriate,
      reason: result.reason,
    };
  } catch (error) {
    logger.error("Content validation error:", error);
    return {
      isValid: false,
      isProgramming: false,
      isAppropriate: false,
      reason: "Validation failed",
    };
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
