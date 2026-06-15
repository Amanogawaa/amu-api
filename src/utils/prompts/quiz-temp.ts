export const generateQuizPrompt = (args: {
  lessonName: string;
  previousLessonsContent: string;
  numberOfQuestions: number;
  difficulty: string;
}) => `You are an expert educator creating assessment questions.

Context:
Lesson: ${args.lessonName}
Content:
${args.previousLessonsContent}

Task:
Generate ${args.numberOfQuestions} ${args.difficulty} level quiz questions testing the content above.
Mix question types: multiple-choice, true-false, and identification.

Difficulty:
- easy: Direct recall, definitions
- medium: Application, analysis
- hard: Problem-solving, scenarios

Rules:
1. Test ONLY provided content.
2. Mix question types.
3. For multiple-choice: provide 4 options. The correctAnswer must be the exact optionId.
4. For true-false: the correctAnswer must be "true" or "false" (lowercase), and omit options.
5. For identification: the correctAnswer should be a short, precise string (1-3 words), and omit options.
6. Explanations must be clear and educational.

Return valid JSON complying with the required schema.`;
