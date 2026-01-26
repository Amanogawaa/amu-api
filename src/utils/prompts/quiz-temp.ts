export const generateQuizPrompt = (args: {
  lessonName: string;
  previousLessonsContent: string;
  numberOfQuestions: number;
  difficulty: string;
}) => `You are an expert educator creating diverse assessment questions for an interactive learning platform.

**Context**:
Current Lesson: ${args.lessonName}
Previous Lessons Content to Test:
${args.previousLessonsContent}

**Your Task**:
Generate ${args.numberOfQuestions} ${args.difficulty} level quiz questions with VARIED question types that test understanding of the content above.

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
    },
    {
      "questionId": "q2",
      "questionText": "JavaScript was created by _____ in _____.",
      "questionType": "fill-in-the-blank",
      "blanks": [
        {
          "blankId": "b1",
          "acceptableAnswers": ["Brendan Eich", "brendan eich", "Eich"]
        },
        {
          "blankId": "b2",
          "acceptableAnswers": ["1995", "nineteen ninety-five"]
        }
      ],
      "correctAnswer": ["Brendan Eich", "1995"],
      "explanation": "JavaScript was created by Brendan Eich in 1995",
      "points": 2
    },
    {
      "questionId": "q3",
      "questionText": "Match the HTTP method with its purpose",
      "questionType": "matching",
      "matchPairs": [
        { "leftId": "1", "leftText": "GET", "rightId": "a", "rightText": "Retrieve data" },
        { "leftId": "2", "leftText": "POST", "rightId": "b", "rightText": "Create new resource" },
        { "leftId": "3", "leftText": "PUT", "rightId": "c", "rightText": "Update resource" },
        { "leftId": "4", "leftText": "DELETE", "rightId": "d", "rightText": "Remove resource" }
      ],
      "correctAnswer": ["1-a", "2-b", "3-c", "4-d"],
      "explanation": "Each HTTP method has a specific purpose in RESTful APIs",
      "points": 2
    },
    {
      "questionId": "q4",
      "questionText": "Is this statement true or false?",
      "questionType": "true-false",
      "options": [
        { "optionId": "true", "optionText": "True" },
        { "optionId": "false", "optionText": "False" }
      ],
      "correctAnswer": "true",
      "explanation": "Explanation of why it's true",
      "points": 1
    },
    {
      "questionId": "q5",
      "questionText": "You are building an e-commerce application...",
      "questionType": "scenario-based",
      "scenario": "You are building an e-commerce application with user authentication. A user attempts to access their order history, but their session has expired.",
      "options": [
        { "optionId": "a", "optionText": "Show cached order data" },
        { "optionId": "b", "optionText": "Redirect to login page" },
        { "optionId": "c", "optionText": "Display error message only" },
        { "optionId": "d", "optionText": "Auto-refresh session" }
      ],
      "correctAnswer": "b",
      "explanation": "When session expires, redirect to login to re-authenticate",
      "points": 2
    }
  ]
}

**Question Type Distribution** (Mix them appropriately):
1. **multiple-choice** (40%): 4 options, one correct answer
2. **true-false** (20%): Binary choice questions
3. **fill-in-the-blank** (15%): Text with blanks to complete, include acceptable variations
4. **matching** (15%): Match items from two columns (3-5 pairs)
5. **scenario-based** (10%): Real-world scenario with multiple-choice answers

**Difficulty Levels**:
- **easy**: Direct recall, definitions, basic concepts
- **medium**: Application, comparison, analysis
- **hard**: Problem-solving, synthesis, edge cases, scenarios

**Quality Rules**:
1. Questions must test content from previous lessons only
2. Each question tests ONE specific concept
3. Avoid trick questions or ambiguity
4. For multiple-choice: options should be similar length and complexity
5. For fill-in-the-blank: provide multiple acceptable answer variations (case-insensitive)
6. For matching: ensure clear, unambiguous pairs (3-5 pairs maximum)
7. For scenario-based: create realistic, practical situations
8. Distractors (wrong answers) should be plausible
9. Explanations must be clear and educational

**Additional Guidelines**:
- Use clear, professional language
- Avoid "all of the above" or "none of the above"
- Make sure only ONE answer is definitively correct
- Include code snippets in questions if relevant
- For fill-in-the-blank: mark blanks with _____ in questionText
- For matching: correctAnswer format is ["leftId-rightId", "leftId-rightId", ...]
- Vary question types throughout the quiz for engagement

Return ONLY valid JSON with the questions array.`;
