import { SYSTEM_PROMPTS } from "./system-prompts";
import type { PromptMode, PromptPayload } from "./types";

export type LessonPromptMode = PromptMode;

interface LessonPromptArgs {
  chapterId: string;
  chapterName: string;
  chapterDescription: string;
  chapterOrder: number;
  learningObjectives: string[];
  keyTopics: string[];
  estimatedDuration: string;
  courseName: string;
  level: string;
  language: string;
  userInstructions?: string;
}

interface BuildLessonsPromptOptions {
  mode?: LessonPromptMode;
}

const legacyLessonsPrompt = (args: LessonPromptArgs): string => {
  const feedback = args.userInstructions
    ? `\n**USER FEEDBACK:**\n${args.userInstructions}`
    : "";

  return `Create lessons for Chapter ${args.chapterOrder}: ${args.chapterName}

Course: ${args.courseName} (${args.level})
Context: ${args.chapterDescription}
Topics: ${args.keyTopics.join(", ")}
Chapter Duration: ${args.estimatedDuration}
Language: ${args.language}
${feedback}

Return valid JSON only:
{
  "lessons": [
    {
      "lessonOrder": 1,
      "lessonName": "string",
      "type": "video | article | quiz | exercise",
      "duration": "Xm",
      "lessonDescription": "2-3 sentences",
      "content": "markdown for article, null for video/quiz",
      "videoSearchQuery": "string for video only, null otherwise",
      "resources": [
        {"title": "string", "url": "string", "type": "documentation | article | tool | video"}
      ],
      "learningOutcome": "string",
      "prerequisites": ["string"],
      "playgroundEnvironment": {
        "type": "vanilla | frontend | backend | none",
        "framework": "string | null",
        "dependencies": ["string"],
        "supportsExecution": true | false,
        "executionEngine": "piston | judge0 | sandpack | none",
        "config": {"template": "string", "files": {}} | null
      } | null
    }
  ]
}

LESSON STRUCTURE GUIDELINES (be flexible, adapt to chapter needs):
- Determine optimal number of lessons based on chapter topics and duration
- **IMPORTANT: Mix theory with practice** for programming courses:
  * Use VIDEO (12m) for concepts and overviews
  * Use ARTICLE (18-25m) for in-depth explanations with code examples
  * Use QUIZ (3-5m) after every 1-2 lessons to test understanding
  * **Use EXERCISE (10-20m) for hands-on coding challenges** - essential for programming topics!
- Recommended patterns:
  * Short chapters (30m-1h): 4-6 lessons (video + article + exercise + quiz)
  * Medium chapters (1-2h): 6-10 lessons (video + 2 articles + exercise + quiz + article + exercise + quiz)
  * Long chapters (2-3h): 8-15 lessons (2 videos + 2 articles + exercise + quiz + 2 articles + exercise + quiz + exercise)
- Include at least 1 EXERCISE per chapter for programming courses
- Aim for: 30-40% quiz content, 20-30% exercise content in total lesson count

Total lesson durations must equal ${args.estimatedDuration} (±5m).

VIDEO LESSON (Lesson 1):
- Duration: 10-12m
- Content: null
- VideoSearchQuery: "${args.chapterName} {topic} tutorial ${args.level}"
  Example: "React useState hook tutorial beginner"
- Description: Conceptual overview, what and why
- Resources: Official docs + interactive playground (2-3 resources)

ARTICLE LESSONS (Lessons 2-3):
- Duration: 20-25m each
- Content: Write 800-1200 word markdown:

## Introduction
Brief overview (2-3 sentences)

## {Main Topic}
Detailed explanation

\`\`\`${args.language}
// Code example with comments
\`\`\`

*Pro Tip*: Helpful insight

## Practical Example
Real-world application with complete code

## Key Takeaways
- Point 1
- Point 2
- Point 3

- VideoSearchQuery: null
- Must include 3-5 code examples
- Use callouts: Pro Tip, Common Mistake, Note
- Resources: Official docs, tutorials, tools (2-3)

Lesson 2 focus: Fundamentals and basic usage
Lesson 3 focus: Advanced techniques, best practices, edge cases

EXERCISE LESSON (hands-on coding challenge):
- Duration: 10-20m
- Content: Markdown with problem description, requirements, example I/O, hints:

## Problem
Brief description of coding challenge

## Requirements
- What the solution must accomplish
- Edge cases to handle

## Example
\`\`\`
Input: example input
Output: expected output
\`\`\`

## Hints
- Tips without giving away solution

- VideoSearchQuery: null
- playgroundEnvironment: REQUIRED! Must include:
  * type: "vanilla" | "frontend" | "backend"
  * executionEngine: "piston" (vanilla) | "sandpack" (frontend)
  * config.starterCode: Function signature or component template
  * Example: {"type":"vanilla","framework":null,"dependencies":[],"supportsExecution":true,"executionEngine":"piston","config":{"starterCode":"def solve(n):\n    # Your code here\n    pass"}}
- Description: "Practice {concept} by building {task}"
- Resources: Links to relevant docs for the challenge
- Learning outcome: "Implement {concept} to solve {problem}"

QUIZ LESSON (interspersed throughout):
- Duration: 3-5m
- Content: null
- VideoSearchQuery: null
- Description: "Test your understanding of {topics covered in previous 1-2 lessons}"
- Resources: Link to the lessons being tested
- Place AFTER every 1-2 content lessons for immediate reinforcement
- Example: After lessons 2-3, after lessons 5-6, after lessons 8-9

PLAYGROUND ENVIRONMENT (CRITICAL - analyze code in lesson):
- Detect appropriate playground based on lesson code examples:
  * **vanilla**: Single-file code (Python DSA, JS algorithms, Java basics) → {"type":"vanilla","framework":null,"dependencies":[],"supportsExecution":true,"executionEngine":"piston"}
  * **frontend**: React/Vue/Angular components with JSX/templates → {"type":"frontend","framework":"react","dependencies":["react","react-dom"],"supportsExecution":true,"executionEngine":"sandpack","config":{"template":"react"}}
  * **backend**: Django/FastAPI/Flask requiring framework setup → {"type":"backend","framework":"django","dependencies":["django"],"supportsExecution":false,"executionEngine":"none","config":{"files":{"views.py":"","models.py":""}}}
  * **none**: No code examples (video/quiz) → playgroundEnvironment=null
- For EXERCISE lessons, MUST include config.starterCode with function/class template
- Examples:
  * "Python Binary Search" → vanilla/piston with starterCode="def binary_search(arr, target):\n    pass"
  * "React Hooks Tutorial" → frontend/sandpack/react
  * "FastAPI REST API" → backend/none/fastapi (read-only)
  * Quiz lesson → null

RULES:
- lessonOrder: Sequential (1, 2, 3, 4, 5, ...)
- Only article and exercise types have markdown content
- Video/quiz types: content must be null
- Exercise type: content has problem + hints, playgroundEnvironment.config.starterCode has template
- Each lesson needs 1 specific learning outcome using action verbs
- Prerequisites: Build on previous lessons logically
- Intersperse quizzes throughout - don't put all at the end
- **For programming courses: Include exercise lessons for hands-on practice**
- Each quiz tests only the immediately preceding 1-2 lessons
- **MUST include playgroundEnvironment** for lessons with code (articles/exercises), null for video/quiz

Level adjustments:
- Beginner: More examples, step-by-step, simpler language
- Intermediate: Balance theory/practice, real-world scenarios
- Advanced: Dense content, best practices, edge cases`;
};

const systemLessonsPrompt = (args: LessonPromptArgs): PromptPayload => {
  const lines = [
    `Create lessons for chapter "${args.chapterName}" (order ${args.chapterOrder}) within ${args.estimatedDuration}.`,
    `Course: ${args.courseName} | Level: ${args.level} | Language: ${args.language}`,
    `Chapter summary: ${args.chapterDescription}`,
    `Learning objectives: ${args.learningObjectives.join(" | ")}`,
    `Key topics: ${args.keyTopics.join(", ")}`,
    "Create an optimal number of lessons based on the chapter's topics, complexity, and duration.",
    "Focus on quality and natural topic flow rather than hitting a specific lesson count.",
  ];

  if (args.userInstructions) {
    lines.push("User feedback to apply:", args.userInstructions);
  }

  return {
    userPrompt: lines.join("\n"),
    systemPrompt: SYSTEM_PROMPTS.LESSON,
  };
};

export const buildLessonsPrompt = (
  args: LessonPromptArgs,
  options: BuildLessonsPromptOptions = {},
): PromptPayload => {
  const mode = options.mode ?? "system";

  if (mode === "legacy") {
    return {
      userPrompt: legacyLessonsPrompt(args),
    };
  }

  return systemLessonsPrompt(args);
};
