export interface Recommendation {
  courseId: string;
  score: number;
  reason: string;
  metadata: {
    isSequentialNext?: boolean;
    topicSimilarity?: number;
    tagOverlap?: number;
    difficultyProgression?: boolean;
    enrollmentCount?: number;
  };
}

export interface RecommendationWithCourse extends Recommendation {
  course: {
    name: string;
    topic: string;
    level: string;
    description: string;
    category: string;
    thumbnailUrl?: string;
    authorId: string;
    enrollmentCount?: number;
    likesCount?: number;
  };
}

export interface RecommendationCache {
  id?: string;
  uid: string;
  courseId?: string;
  type: "learning-continuity" | "liked-based" | "general";
  recommendations: Recommendation[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationResponse {
  recommendations: RecommendationWithCourse[];
  type: "learning-continuity" | "liked-based" | "general";
  generatedAt: string;
  fromCache: boolean;
}

export interface LearningContinuityParams {
  userId: string;
  completedCourseId: string;
  limit?: number;
}

export interface ScoringFactors {
  isNextInSequence: boolean;
  difficultyProgression: number; // 0-1 score
  topicSimilarity: number; // 0-1 score
  tagOverlap: number; // 0-1 score
  enrollmentCount: number;
  likesCount: number;
}

export interface ScoringWeights {
  sequentialProgression: number; // default 0.5
  topicSimilarity: number; // default 0.3
  popularity: number; // default 0.2
}

export const recommendationCacheSchema = {
  type: "object",
  properties: {
    uid: { type: "string" },
    courseId: { type: "string" },
    type: {
      type: "string",
      enum: ["learning-continuity", "liked-based", "general"],
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          courseId: { type: "string" },
          score: { type: "number" },
          reason: { type: "string" },
          metadata: { type: "object" },
        },
      },
    },
    expiresAt: { type: "string" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
  required: ["uid", "type", "recommendations", "expiresAt"],
};
