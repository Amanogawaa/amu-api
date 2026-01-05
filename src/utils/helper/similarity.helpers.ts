import Fuse from "fuse.js";
import type { Course } from "../../features/course/types";

export const SIMILARITY_CONFIG = {
  FUZZY_MATCH_THRESHOLD: 0.3,
  EXACT_MATCH_THRESHOLD: 0.95,
  CHECK_ENABLED: true,
};

export function normalizeTopic(topic: string): string {
  return topic
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate similarity between two topics using token-based approach
 * Returns a score between 0 (completely different) and 1 (identical)
 */
export function calculateTokenSimilarity(
  topic1: string,
  topic2: string,
): number {
  const normalized1 = normalizeTopic(topic1);
  const normalized2 = normalizeTopic(topic2);

  if (normalized1 === normalized2) {
    return 1.0;
  }

  const tokens1 = new Set(normalized1.split(" "));
  const tokens2 = new Set(normalized2.split(" "));

  const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  return intersection.size / union.size;
}

/**
 * Find similar courses using Fuse.js fuzzy matching
 * Returns courses sorted by similarity score (most similar first)
 */
export function findSimilarCourses(
  existingCourses: Course[],
  targetTopic: string,
  targetLevel: string,
  targetCategory: string,
): Array<{ course: Course; similarityScore: number; reason: string }> {
  if (existingCourses.length === 0) {
    return [];
  }

  const normalizedTarget = normalizeTopic(targetTopic);
  const results: Array<{
    course: Course;
    similarityScore: number;
    reason: string;
  }> = [];

  for (const course of existingCourses) {
    const normalizedCourse = normalizeTopic(course.topic);

    if (
      normalizedCourse === normalizedTarget &&
      course.level === targetLevel &&
      course.category === targetCategory
    ) {
      results.push({
        course,
        similarityScore: 1.0,
        reason: "Exact match: same topic, level, and category",
      });
      continue;
    }

    if (normalizedCourse === normalizedTarget && course.level === targetLevel) {
      results.push({
        course,
        similarityScore: 0.95,
        reason: "Same topic and level, different category",
      });
      continue;
    }

    if (normalizedCourse === normalizedTarget) {
      results.push({
        course,
        similarityScore: 0.85,
        reason: `Same topic, different level (existing: ${course.level})`,
      });
      continue;
    }
  }

  const fuse = new Fuse(existingCourses, {
    keys: ["topic"],
    threshold: SIMILARITY_CONFIG.FUZZY_MATCH_THRESHOLD,
    includeScore: true,
    ignoreLocation: true,
  });

  const fuzzyResults = fuse.search(targetTopic);

  for (const result of fuzzyResults) {
    const course = result.item;
    const fuseScore = result.score || 0;

    if (results.some((r) => r.course.id === course.id)) {
      continue;
    }

    let similarityScore = 1 - fuseScore;

    if (course.level === targetLevel) {
      similarityScore = Math.min(similarityScore + 0.1, 1.0);
    }

    if (course.category === targetCategory) {
      similarityScore = Math.min(similarityScore + 0.05, 1.0);
    }

    const tokenScore = calculateTokenSimilarity(course.topic, targetTopic);

    const finalScore = Math.max(similarityScore, tokenScore);

    if (finalScore >= 0.7) {
      results.push({
        course,
        similarityScore: finalScore,
        reason: `Similar topic detected (${Math.round(finalScore * 100)}% match)`,
      });
    }
  }

  results.sort((a, b) => b.similarityScore - a.similarityScore);

  return results;
}

/**
 * Check if a course is a duplicate based on similarity threshold
 */
export function isDuplicateCourse(
  existingCourses: Course[],
  targetTopic: string,
  targetLevel: string,
  targetCategory: string,
  threshold: number = 0.85,
): {
  isDuplicate: boolean;
  similarCourse?: Course;
  score?: number;
  reason?: string;
} {
  const similarCourses = findSimilarCourses(
    existingCourses,
    targetTopic,
    targetLevel,
    targetCategory,
  );

  if (similarCourses.length === 0) {
    return { isDuplicate: false };
  }

  const mostSimilar = similarCourses[0];

  if (mostSimilar!.similarityScore >= threshold) {
    return {
      isDuplicate: true,
      similarCourse: mostSimilar!.course,
      score: mostSimilar!.similarityScore,
      reason: mostSimilar!.reason,
    };
  }

  return { isDuplicate: false };
}
