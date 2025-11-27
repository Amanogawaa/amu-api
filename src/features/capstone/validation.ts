import { z } from 'zod';

export const createCapstoneSubmissionSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  guidelineId: z.string().min(1, 'Guideline ID is required'),
  githubRepoUrl: z
    .string()
    .url('Invalid GitHub URL')
    .regex(
      /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/,
      'Must be a valid GitHub repository URL (e.g., https://github.com/username/repo)'
    ),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
});

export const updateCapstoneSubmissionSchema = z.object({
  githubRepoUrl: z
    .string()
    .url('Invalid GitHub URL')
    .regex(
      /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/,
      'Must be a valid GitHub repository URL'
    )
    .optional(),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
});

export const capstoneSubmissionQuerySchema = z.object({
  courseId: z.string().optional(),
  userId: z.string().optional(),
  sortBy: z
    .enum(['recent', 'popular', 'mostReviewed', 'topRated'])
    .optional()
    .default('recent'),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});

export const createCapstoneReviewSchema = z.object({
  capstoneSubmissionId: z.string().min(1, 'Capstone submission ID is required'),
  parentReviewId: z.string().optional(),
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
  feedback: z
    .string()
    .min(10, 'Feedback must be at least 10 characters') 
    .max(2000, 'Feedback must be less than 2000 characters'),
  highlights: z
    .array(z.string().min(1).max(200))
    .max(5, 'Maximum 5 highlights allowed')
    .optional()
    .default([]),
  suggestions: z
    .array(z.string().min(1).max(200))
    .max(5, 'Maximum 5 suggestions allowed')
    .optional()
    .default([]),
  criteriaScores: z
    .array(
      z.object({
        criteriaName: z.string().min(1),
        score: z.number().min(0).max(100),
        comment: z.string().max(500).optional(),
      })
    )
    .optional(),
});

export const updateCapstoneReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
  feedback: z
    .string()
    .min(20, 'Feedback must be at least 20 characters')
    .max(2000, 'Feedback must be less than 2000 characters')
    .optional(),
  highlights: z
    .array(z.string().min(1).max(200))
    .max(5, 'Maximum 5 highlights allowed')
    .optional()
    .default([]),
  suggestions: z
    .array(z.string().min(1).max(200))
    .max(5, 'Maximum 5 suggestions allowed')
    .optional()
    .default([]),
  criteriaScores: z
    .array(
      z.object({
        criteriaName: z.string().min(1),
        score: z.number().min(0).max(100),
        comment: z.string().max(500).optional(),
      })
    )
    .optional(),
});

export const capstoneReviewQuerySchema = z.object({
  capstoneSubmissionId: z.string().optional(),
  reviewerId: z.string().optional(),
  parentReviewId: z
    .string()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});

// GitHub Integration Validation
export const githubRepoUrlSchema = z.object({
  repoUrl: z
    .string()
    .url('Invalid URL')
    .regex(
      /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/,
      'Must be a valid GitHub repository URL'
    ),
});

export const githubCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

// Type exports
export type CreateCapstoneSubmissionInput = z.infer<
  typeof createCapstoneSubmissionSchema
>;
export type UpdateCapstoneSubmissionInput = z.infer<
  typeof updateCapstoneSubmissionSchema
>;
export type CapstoneSubmissionQueryInput = z.infer<
  typeof capstoneSubmissionQuerySchema
>;

export type CreateCapstoneReviewInput = z.infer<
  typeof createCapstoneReviewSchema
>;
export type UpdateCapstoneReviewInput = z.infer<
  typeof updateCapstoneReviewSchema
>;
export type CapstoneReviewQueryInput = z.infer<
  typeof capstoneReviewQuerySchema
>;

export type GitHubRepoUrlInput = z.infer<typeof githubRepoUrlSchema>;
export type GitHubCallbackInput = z.infer<typeof githubCallbackSchema>;

export const validateCreateCapstoneSubmission = (data: unknown) => {
  return createCapstoneSubmissionSchema.parse(data);
};

export const validateUpdateCapstoneSubmission = (data: unknown) => {
  return updateCapstoneSubmissionSchema.parse(data);
};

export const validateCreateCapstoneReview = (data: unknown) => {
  return createCapstoneReviewSchema.parse(data);
};

export const validateUpdateCapstoneReview = (data: unknown) => {
  return updateCapstoneReviewSchema.parse(data);
};

export const validateGitHubRepoUrl = (data: unknown) => {
  return githubRepoUrlSchema.parse(data);
};

export const validateGitHubCallback = (data: unknown) => {
  return githubCallbackSchema.parse(data);
};
