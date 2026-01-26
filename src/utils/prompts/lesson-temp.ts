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
      "type": "video | article | quiz",
      "duration": "Xm",
      "lessonDescription": "2-3 sentences",
      "content": "markdown for article, null for video/quiz",
      "videoSearchQuery": "string for video only, null otherwise",
      "resources": [
        {"title": "string", "url": "string", "type": "documentation | article | tool | video"}
      ],
      "learningOutcome": "string",
      "prerequisites": ["string"]
    }
  ]
}

LESSON STRUCTURE GUIDELINES (be flexible, adapt to chapter needs):
- Determine optimal number of lessons based on chapter topics and duration
- **IMPORTANT: Use DataCamp-style interspersed quizzes** throughout the chapter:
  * Insert QUIZ lessons (3-5m) after every 1-2 content lessons
  * Each quiz tests concepts from immediately preceding lessons
  * Better engagement and retention than one quiz at the end
- Common patterns:
  * Short chapters (30m-1h): 4-6 lessons
  * Medium chapters (1-2h): 6-10 lessons  
  * Long chapters (2-3h): 8-15 lessons
  * Aim for 30-40% quiz content in total lesson count

Recommended lesson flow (adapt as needed):
- Pattern 1: Video (12m) + Article (18m) + Quiz (5m) + Article (20m) + Quiz (5m) = 60m
- Pattern 2: Video (10m) + Video (12m) + Quiz (5m) + Article (20m) + Article (18m) + Quiz (5m) + Article (15m) + Quiz (5m) = 90m
- Pattern 3: Video (12m) + Article (20m) + Article (18m) + Quiz (5m) + Video (10m) + Article (20m) + Quiz (5m) + Article (15m) + Quiz (5m) = 110m

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

QUIZ LESSON (interspersed throughout):
- Duration: 3-5m
- Content: null
- VideoSearchQuery: null
- Description: "Test your understanding of {topics covered in previous 1-2 lessons}"
- Resources: Link to the lessons being tested
- Place AFTER every 1-2 content lessons for immediate reinforcement
- Example: After lessons 2-3, after lessons 5-6, after lessons 8-9

RULES:
- lessonOrder: Sequential (1, 2, 3, 4, 5, ...)
- Only article type has markdown content
- Video/quiz types: content must be null
- Each lesson needs 1 specific learning outcome using action verbs
- Prerequisites: Build on previous lessons logically
- Intersperse quizzes throughout - don't put all at the end
- Each quiz tests only the immediately preceding 1-2 lessons

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
