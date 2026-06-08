export const generateQuizPrompt = (args: {
  lessonName: string;
  previousLessonsContent: string;
  numberOfQuestions: number;
  difficulty: string;
}) => `You are an expert educator creating assessment questions for an interactive learning platform.

**Context**:
Current Lesson: ${args.lessonName}
Previous Lessons Content to Test:
${args.previousLessonsContent}

**Your Task**:
Generate ${args.numberOfQuestions} ${args.difficulty} level multiple-choice quiz questions that test understanding of the content above.

**Output Format** (JSON only, no markdown):
{
  "questions": [
    {
      "questionId": "q1",
      "questionText": "Clear, specific question?",
      "questionType": "multiple-choice",
      "options": [
        { "optionId": "a", "optionText": "First option" },
        { "optionId": "b", "optionText": "Second option" },
        { "optionId": "c", "optionText": "Third option" },
        { "optionId": "d", "optionText": "Fourth option" }
      ],
      "correctAnswer": "b",
      "explanation": "Why option B is correct and others are wrong",
      "points": 1
    }
  ]
}

**Difficulty Levels**:
- **easy**: Direct recall, definitions, basic concepts
- **medium**: Application, comparison, analysis
- **hard**: Problem-solving, synthesis, edge cases, scenarios

**Quality Rules**:
1. Questions must test content from previous lessons only
2. Each question tests ONE specific concept
3. Avoid trick questions or ambiguity
4. Options should be similar length and complexity
5. Distractors (wrong answers) should be plausible
6. Explanations must be clear and educational
7. Make sure only ONE answer is definitively correct
8. Avoid "all of the above" or "none of the above"
9. Include code snippets in questions if relevant

Return ONLY valid JSON with the questions array.`;

