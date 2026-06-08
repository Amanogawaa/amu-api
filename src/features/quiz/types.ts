export interface Quiz {
  id: string;
  lessonId: string;
  questions: QuizQuestion[];
  passingScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuizQuestion {
  questionId: string;
  questionText: string;
  questionType:
    | "multiple-choice"
    | "true-false"
    | "fill-in-the-blank"
    | "matching"
    | "scenario-based";
  options?: QuizOption[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  blanks?: {
    blankId: string;
    acceptableAnswers: string[];
  }[];
  matchPairs?: {
    leftId: string;
    leftText: string;
    rightId: string;
    rightText: string;
  }[];
  scenario?: string;
}

export interface QuizOption {
  optionId: string;
  optionText: string;
}

export interface GenerateQuizRequest {
  lessonId: string;
  lessonName: string;
  previousLessonsContent: string;
  numberOfQuestions?: number;
  difficulty?: "easy" | "medium" | "hard";
}

export interface SubmitQuizRequest {
  quizId: string;
  answers: {
    questionId: string;
    selectedAnswer: string;
  }[];
}

export interface QuizAttempt {
  id: string;
  userId: string;
  lessonId: string;
  quizId: string;
  answers: UserAnswer[];
  score: number;
  passed: boolean;
  startedAt: Date;
  completedAt: Date;
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer: string | string[]; // string[] for matching type
  isCorrect: boolean;
  correctAnswer: string | string[];
  explanation: string;
}

export interface QuizGenerationResponse {
  questions: QuizQuestion[];
}

export const quizSchema = {
  type: "object" as const,
  properties: {
    questions: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          questionId: { type: "string" as const },
          questionText: { type: "string" as const },
          questionType: {
            type: "string" as const,
            enum: ["multiple-choice"],
          },
          options: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                optionId: { type: "string" as const },
                optionText: { type: "string" as const },
              },
              required: ["optionId", "optionText"],
            },
          },
          correctAnswer: { type: "string" as const },
          explanation: { type: "string" as const },
          points: { type: "number" as const },
        },
        required: [
          "questionId",
          "questionText",
          "questionType",
          "options",
          "correctAnswer",
          "explanation",
          "points",
        ],
      },
    },
  },
  required: ["questions"],
};
