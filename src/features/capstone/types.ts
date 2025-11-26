export interface CapstoneGuideline {
  id: string;
  courseId: string;
  title: string;
  description: string;
  objectives: string[];
  gettingStarted?: {
    prerequisites: string[];
    setupInstructions: string[];
    recommendedApproach: string;
  };
  implementationRoadmap?: Array<{
    phase: string;
    duration: string;
    tasks: string[];
    modules: string[];
  }>;
  requiredFeatures: string[];
  suggestedFeatures: string[];
  technicalRequirements: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    apis: string[];
    database: string;
  };
  projectStructure?: {
    description: string;
    example: string;
  };
  deliverables: string[];
  evaluationCriteria: Array<{
    name: string;
    description: string;
    weight: number;
  }>;
  commonChallenges?: string[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  resources: string[];
  examples: string[];
  moduleMapping?: Array<{
    moduleName: string;
    skills: string[];
    application: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

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
  screenshots: string[]; 
}

export interface CapstoneReview {
  id: string;
  capstoneSubmissionId: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerEmail?: string;
  parentReviewId?: string; 
  rating?: number; 
  feedback: string;
  highlights?: string[]; 
  suggestions?: string[]; 
  criteriaScores?: Array<{
    criteriaName: string;
    score: number;
    comment?: string;
  }>;
  isHelpful?: boolean; 
  helpfulCount: number;
  images: string[]; 
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
}

export interface CapstoneLike {
  id: string; 
  capstoneSubmissionId: string;
  userId: string;
  createdAt: Date;
}

export interface GitHubConnection {
  userId: string;
  githubUsername: string;
  githubUserId: string;
  avatarUrl?: string;
  accessToken: string;
  connectedAt: Date;
  lastSync: Date;
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
  parentReviewId?: string; 
  rating?: number; 
  feedback: string;
  highlights?: string[];
  suggestions?: string[];
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

export interface CapstoneReviewReplyParams {
  parentReviewId?: string; 
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
  parentReviewId?: string | null; 
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

export const capstoneSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description:
        'Project-focused title matching the domain (e.g., "Build a Banking System in C", "E-commerce API")',
    },
    description: {
      type: 'string',
      description:
        '1-2 paragraphs explaining what the project is, why it is valuable, and how it synthesizes course content',
    },
    objectives: {
      type: 'array',
      items: { type: 'string' },
      description:
        '5-7 specific measurable objectives referencing course modules',
    },
    gettingStarted: {
      type: 'object',
      properties: {
        prerequisites: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Software/tools and knowledge requirements before starting',
        },
        setupInstructions: {
          type: 'array',
          items: { type: 'string' },
          description:
            '4-6 clear setup steps including environment setup, project structure, and initial configuration',
        },
        recommendedApproach: {
          type: 'string',
          description:
            'Suggested order to tackle the project (e.g., start with data structures, then implement core logic)',
        },
      },
      required: ['prerequisites', 'setupInstructions', 'recommendedApproach'],
    },
    implementationRoadmap: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            description: 'Phase name (e.g., "Phase 1: Foundation")',
          },
          duration: {
            type: 'string',
            description: 'Estimated time for this phase',
          },
          tasks: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of tasks for this phase',
          },
          modules: {
            type: 'array',
            items: { type: 'string' },
            description: 'Course modules to reference for this phase',
          },
        },
        required: ['phase', 'duration', 'tasks', 'modules'],
      },
      description: 'At least 3 phases breaking down the implementation',
    },
    requiredFeatures: {
      type: 'array',
      items: { type: 'string' },
      description:
        '5-8 core features that are specific, testable, and domain-appropriate',
    },
    suggestedFeatures: {
      type: 'array',
      items: { type: 'string' },
      description: '3-5 optional enhancement features for advanced students',
    },
    technicalRequirements: {
      type: 'object',
      properties: {
        languages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Programming languages used',
        },
        frameworks: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Frameworks/libraries (can be empty for non-framework projects like pure C)',
        },
        tools: {
          type: 'array',
          items: { type: 'string' },
          description: 'Domain-specific tools: IDE, compiler, debugger, etc.',
        },
        apis: {
          type: 'array',
          items: { type: 'string' },
          description: 'APIs if applicable based on course content',
        },
        database: {
          type: 'string',
          description:
            'Database system or "None" or "File-based storage" for non-DB projects',
        },
      },
      required: ['languages', 'frameworks', 'tools', 'apis', 'database'],
    },
    projectStructure: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Explanation of recommended file/folder structure',
        },
        example: {
          type: 'string',
          description:
            'Example folder structure (e.g., "src/, include/, tests/")',
        },
      },
      required: ['description', 'example'],
    },
    deliverables: {
      type: 'array',
      items: { type: 'string' },
      description:
        'What students must submit (GitHub repo, README, documentation, etc.)',
    },
    evaluationCriteria: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Criteria name (e.g., "Code Quality")',
          },
          weight: {
            type: 'number',
            description: 'Percentage weight (must total 100 across all)',
          },
          description: {
            type: 'string',
            description: 'What this criteria evaluates',
          },
        },
        required: ['name', 'weight', 'description'],
      },
      description: '5 evaluation criteria with weights totaling exactly 100%',
    },
    commonChallenges: {
      type: 'array',
      items: { type: 'string' },
      description:
        '3-4 common pitfalls students might face and how to overcome them',
    },
    estimatedTime: {
      type: 'string',
      description:
        'Realistic completion time based on course level (e.g., "10-20h")',
    },
    difficulty: {
      type: 'string',
      enum: ['beginner', 'intermediate', 'advanced'],
      description: 'Project difficulty level matching course level',
    },
    resources: {
      type: 'array',
      items: { type: 'string' },
      description: '3-5 curated resources (official docs, tutorials, books)',
    },
    examples: {
      type: 'array',
      items: { type: 'string' },
      description: '1-3 example projects or URLs demonstrating expected scope',
    },
    moduleMapping: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          moduleName: {
            type: 'string',
            description: 'Name of the course module',
          },
          skills: {
            type: 'array',
            items: { type: 'string' },
            description: 'Skills learned in this module',
          },
          application: {
            type: 'string',
            description: 'How these skills are applied in the capstone project',
          },
        },
        required: ['moduleName', 'skills', 'application'],
      },
      description:
        'Mapping of course modules to capstone requirements showing synthesis',
    },
  },
  required: [
    'title',
    'description',
    'objectives',
    'gettingStarted',
    'implementationRoadmap',
    'requiredFeatures',
    'suggestedFeatures',
    'technicalRequirements',
    'projectStructure',
    'deliverables',
    'evaluationCriteria',
    'commonChallenges',
    'estimatedTime',
    'difficulty',
    'resources',
    'examples',
    'moduleMapping',
  ],
};
