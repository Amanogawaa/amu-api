import { SYSTEM_PROMPTS } from "./system-prompts";

interface ExerciseGuidelineContext {
  lessonId: string;
  lessonName: string;
  lessonDescription: string;
  courseId: string;
  courseName: string;
  chapterName: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  language: string;
  topics: string[];
  estimatedDuration: string;
  learningOutcome: string;
}

/**
 * Generates a comprehensive exercise guideline prompt
 * This replaces the code playground feature with a guide for users to use their own editors
 * Focus: Simple, clear guidance without token overhead
 */
export const generateExerciseGuidelinePrompt = (
  context: ExerciseGuidelineContext,
): string => {
  return `Create a comprehensive but concise exercise guideline for the following lesson:

**Lesson Details:**
- Name: ${context.lessonName}
- Description: ${context.lessonDescription}
- Course: ${context.courseName}
- Chapter: ${context.chapterName}
- Difficulty: ${context.difficulty}
- Estimated Duration: ${context.estimatedDuration}
- Programming Language: ${context.language}
- Topics: ${context.topics.join(", ")}
- Learning Outcome: ${context.learningOutcome}

Return ONLY valid JSON (no markdown, no code blocks):

{
  "id": "auto-generate",
  "lessonId": "${context.lessonId}",
  "courseId": "${context.courseId}",
  "title": "Exercise: [Exercise Name]",
  "description": "A practical coding exercise covering ${context.topics.join(", ")}",
  "objectives": [
    "Objective 1 - [Clear, measurable goal]",
    "Objective 2 - [Clear, measurable goal]",
    "Objective 3 - [Clear, measurable goal]"
  ],
  "gettingStarted": {
    "editorOptions": [
      {
        "name": "VS Code",
        "description": "Professional IDE with excellent plugin ecosystem",
        "url": "https://code.visualstudio.com/",
        "difficulty": "beginner",
        "pros": ["Free and lightweight", "Huge extension library", "Built-in terminal", "Great for ${context.language}"],
        "cons": ["Requires local setup"]
      },
      {
        "name": "Replit",
        "description": "Browser-based IDE for quick prototyping",
        "url": "https://replit.com/",
        "difficulty": "beginner",
        "pros": ["No setup required", "Instant execution", "Easy sharing", "Built-in testing tools"],
        "cons": ["Limited customization", "May have performance limits"]
      },
      {
        "name": "GitHub Codespaces",
        "description": "Cloud development environment with VS Code in browser",
        "url": "https://github.com/features/codespaces",
        "difficulty": "intermediate",
        "pros": ["Full VS Code features", "Integrated with Git", "Works worldwide", "Free tier available"],
        "cons": ["Requires GitHub account", "Usage limits on free tier"]
      }
    ],
    "environmentSetup": [
      "Install ${context.language} runtime/compiler (if needed)",
      "Install a code editor (VS Code, Replit, or similar)",
      "Create a project folder for this exercise",
      "Initialize version control: 'git init' or use GitHub"
    ],
    "recommendedApproach": "Start with Replit for quick testing, then move to VS Code + local environment for professional practice"
  },
  "problemStatement": {
    "description": "A clear, real-world problem that applies the concepts from this lesson",
    "constraints": [
      "Constraint 1: [Specific requirement or limitation]",
      "Constraint 2: [Edge case to handle]",
      "Constraint 3: [Performance or style requirement]"
    ],
    "acceptanceCriteria": [
      "The solution correctly handles [scenario]",
      "The code follows [best practice/style guideline]",
      "The solution completes in [time/resource constraint]"
    ]
  },
  "technicalRequirements": {
    "languages": ["${context.language}"],
    "frameworks": [],
    "tools": ["${context.language === "python" ? "pip" : context.language === "javascript" ? "npm" : "package manager"}"],
    "runtime": "${context.language === "python" ? "Python 3.8+" : context.language === "javascript" ? "Node.js 16+" : "Latest stable"}"
  },
  "solutionApproach": {
    "steps": [
      "Step 1: Understand the problem - Read requirements carefully",
      "Step 2: Plan the algorithm - Sketch the solution on paper",
      "Step 3: Start with pseudocode - Write logic first, code second",
      "Step 4: Implement incrementally - Build feature by feature",
      "Step 5: Test thoroughly - Verify with multiple test cases"
    ],
    "pseudocode": "// High-level algorithm without syntax\\n// Keep this simple and language-agnostic",
    "keyAlgorithms": ["Key algorithm 1 (e.g., sorting, recursion)", "Key algorithm 2", "Key algorithm 3"]
  },
  "projectStructure": {
    "description": "Recommended file organization for your solution",
    "fileStructure": {
      "solution.[ext]": "Your main solution file",
      "tests.[ext]": "Unit tests for your solution (optional but recommended)",
      "README.md": "Documentation: problem description, how to run, what you learned"
    }
  },
  "testingGuidelines": {
    "whatToTest": [
      "Happy path: Standard inputs that should work",
      "Edge cases: Boundary values (empty, single element, maximum values)",
      "Error conditions: Invalid inputs, special cases"
    ],
    "sampleTestCases": [
      {
        "input": "Example input that should work",
        "expectedOutput": "Expected output for that input"
      }
    ],
    "testingTools": [
      "${context.language === "python" ? "pytest or unittest" : context.language === "javascript" ? "Jest or Mocha" : "Built-in or popular testing framework"}",
      "Manual testing in console/terminal"
    ],
    "bestPractices": [
      "Test one thing at a time (unit tests)",
      "Start with simple cases, then add complexity",
      "Test edge cases and boundary conditions",
      "Don't rely only on the 'happy path'"
    ]
  },
  "commonMistakes": [
    {
      "mistake": "Common mistake 1 (e.g., off-by-one error in loops)",
      "correction": "How to fix it: [Clear explanation]",
      "prevention": "How to avoid: [Best practice]"
    },
    {
      "mistake": "Common mistake 2",
      "correction": "How to fix it",
      "prevention": "How to avoid"
    },
    {
      "mistake": "Common mistake 3",
      "correction": "How to fix it",
      "prevention": "How to avoid"
    }
  ],
  "bestPractices": [
    "Write clear, readable code with meaningful variable names",
    "Add comments for complex logic sections",
    "Follow the language's coding conventions",
    "Keep functions small and focused (single responsibility)",
    "Test your code frequently during development"
  ],
  "resources": [
    "Official ${context.language} documentation",
    "Community tutorials relevant to this exercise",
    "Stack Overflow tag for ${context.language}",
    "GitHub examples of similar problems"
  ],
  "examples": {
    "description": "Reference implementations showing different approaches",
    "links": [
      "GitHub repo with solution examples",
      "Tutorial blog posts related to this concept",
      "YouTube videos explaining similar problems"
    ]
  },
  "estimatedTime": "${context.estimatedDuration}",
  "difficulty": "${context.difficulty}",
  "submissionGuidelines": {
    "format": "Submit as a [file/folder/repository] with [specific format]",
    "requiredFiles": [
      "solution.[${context.language}] - Your implementation",
      "README.md - Explanation of your approach"
    ],
    "instructions": [
      "Test your solution locally before submitting",
      "Include comments explaining key parts of your code",
      "Update the README with your learnings and challenges faced",
      "If you got stuck, note what you struggled with and how you overcame it"
    ]
  }
}

CRITICAL GUIDELINES:
1. The JSON must be valid - no trailing commas, properly quoted strings
2. Keep explanations concise but clear - aim for practical guidance
3. Focus on helping users set up their own environment, not using an IDE
4. Provide realistic, actionable steps
5. Include at least 2-3 editor options with trade-offs
6. Ensure content is language-appropriate and suitable for ${context.difficulty} level
7. Do not include any markdown formatting in JSON string values - use escaped newlines instead
`;
};
