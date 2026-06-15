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

Lesson Details:
- Name: ${context.lessonName}
- Description: ${context.lessonDescription}
- Course: ${context.courseName}
- Chapter: ${context.chapterName}
- Difficulty: ${context.difficulty}
- Estimated Duration: ${context.estimatedDuration}
- Programming Language: ${context.language}
- Topics: ${context.topics.join(", ")}
- Learning Outcome: ${context.learningOutcome}

CRITICAL GUIDELINES:
1. Provide realistic, actionable steps.
2. Focus on helping users set up their own environment (e.g. VS Code, Replit).
3. Include at least 2-3 editor options with trade-offs in "editorOptions".
4. Ensure content is language-appropriate for ${context.language} and suitable for ${context.difficulty} level.
5. In "commonMistakes", provide at least 3 common pitfalls specific to ${context.topics.join(", ")}.
6. In "testingGuidelines", provide specific test cases relevant to the problem.

Return valid JSON complying with the requested schema.`;
};
