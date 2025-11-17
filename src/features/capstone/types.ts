// Capstone Guideline (generated per course)
export interface CapstoneGuideline {
  id: string;
  courseId: string;
  title: string;
  description: string;
  objectives: string[];
  requiredFeatures: string[];
  suggestedFeatures: string[];
  technicalRequirements: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    apis: string[];
    database: string;
  };
  deliverables: string[];
  evaluationCriteria: Array<{
    name: string;
    description: string;
    weight: number;
  }>;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  resources: string[];
  examples: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Capstone Submission (user's project)
export interface CapstoneSubmission {
  id: string;
  userId: string;
  courseId: string;
  guidelineId: string;
  githubRepoUrl: string;
  githubRepoName: string;
  githubRepoOwner: string;
  title: string;
  description: string;
  repoMetadata: {
    language: string;
    stars: number;
    forks: number;
    lastUpdated: Date;
    isPrivate: boolean;
  };
  submittedAt: Date;
  updatedAt: Date;
  viewCount: number;
  reviewCount: number;
  likeCount: number;
  averageRating?: number;
}

// Peer Review
export interface CapstoneReview {
  id: string;
  capstoneSubmissionId: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerEmail?: string;
  rating: number; // 1-5 stars
  feedback: string;
  highlights: string[]; // What worked well
  suggestions: string[]; // What could be improved
  criteriaScores?: Array<{
    criteriaName: string;
    score: number;
    comment?: string;
  }>;
  isHelpful?: boolean; // For tracking review quality
  helpfulCount: number; // How many found this review helpful
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
}

// Capstone Like
export interface CapstoneLike {
  id: string; // composite: capstoneSubmissionId_userId
  capstoneSubmissionId: string;
  userId: string;
  createdAt: Date;
}

// GitHub Connection
export interface GitHubConnection {
  userId: string;
  githubUsername: string;
  githubUserId: string;
  avatarUrl?: string;
  accessToken: string; // Will be encrypted
  connectedAt: Date;
  lastSync: Date;
}

// Request/Response Types

export interface GenerateCapstoneGuidelineRequest {
  courseId: string;
  courseName: string;
  courseDescription: string;
  learningOutcomes: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  language: string;
  skillsGained: string[];
  category: string;
}

export interface CreateCapstoneSubmissionRequest {
  courseId: string;
  guidelineId: string;
  githubRepoUrl: string;
  title: string;
  description: string;
}

export interface UpdateCapstoneSubmissionRequest {
  githubRepoUrl?: string;
  title?: string;
  description?: string;
}

export interface CreateCapstoneReviewRequest {
  capstoneSubmissionId: string;
  rating: number;
  feedback: string;
  highlights: string[];
  suggestions: string[];
  criteriaScores?: Array<{
    criteriaName: string;
    score: number;
    comment?: string;
  }>;
}

export interface UpdateCapstoneReviewRequest {
  rating?: number;
  feedback?: string;
  highlights?: string[];
  suggestions?: string[];
  criteriaScores?: Array<{
    criteriaName: string;
    score: number;
    comment?: string;
  }>;
}

export interface CapstoneSubmissionQueryParams {
  courseId?: string;
  userId?: string;
  sortBy?: 'recent' | 'popular' | 'mostReviewed' | 'topRated';
  limit?: number;
  offset?: number;
}

export interface CapstoneReviewQueryParams {
  capstoneSubmissionId?: string;
  reviewerId?: string;
  limit?: number;
  offset?: number;
}

export interface GitHubRepoMetadata {
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  private: boolean;
  default_branch: string;
}

export interface GitHubAuthResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubUserResponse {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
}

// Response Types

export interface CapstoneGuidelineResponse {
  data: CapstoneGuideline;
  message: string;
}

export interface CapstoneSubmissionResponse {
  data: CapstoneSubmission;
  message: string;
}

export interface CapstoneSubmissionsListResponse {
  data: {
    submissions: CapstoneSubmission[];
    total: number;
  };
  message: string;
}

export interface CapstoneReviewResponse {
  data: CapstoneReview;
  message: string;
}

export interface CapstoneReviewsListResponse {
  data: {
    reviews: CapstoneReview[];
    total: number;
    averageRating?: number;
  };
  message: string;
}

export interface CapstoneLikeToggleResponse {
  data: {
    liked: boolean;
    likeCount: number;
  };
  message: string;
}

export interface GitHubConnectionResponse {
  data: {
    connected: boolean;
    githubUsername?: string;
    avatarUrl?: string;
  };
  message: string;
}
