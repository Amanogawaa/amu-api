export const generateQuizPrompt = (args: {
  lessonName: string;
  previousLessonsContent: string;
  numberOfQuestions: number;
  difficulty: string;
}) => `You are an expert educator creating assessment questions.

**Context**:
Current Lesson: ${args.lessonName}
Previous Lessons Content to Test:
${args.previousLessonsContent}

**Your Task**:
Generate ${args.numberOfQuestions} ${args.difficulty} level quiz questions that test understanding of the content above.

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

**Question Guidelines**:
1. **Question Types**: 
   - 70% multiple-choice (4 options)
   - 30% true-false

2. **Difficulty Levels**:
   - **easy**: Direct recall, definitions, basic concepts
   - **medium**: Application, comparison, analysis
   - **hard**: Problem-solving, synthesis, edge cases

3. **Quality Rules**:
   - Questions must test content from previous lessons only
   - Each question tests ONE specific concept
   - Avoid trick questions or ambiguity
   - Options should be similar length and complexity
   - Distractors (wrong answers) should be plausible
   - Explanations must be clear and educational

4. **Question Structure**:
   - Use clear, professional language
   - Avoid "all of the above" or "none of the above"
   - Make sure only ONE answer is definitively correct
   - Include code snippets in questions if relevant

Return ONLY valid JSON with the questions array.`;
