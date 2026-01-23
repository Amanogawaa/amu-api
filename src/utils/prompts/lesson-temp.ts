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
- Common patterns:
  * Short chapters (30m-1h): 3-5 lessons
  * Medium chapters (1-2h): 4-7 lessons  
  * Long chapters (2-3h): 6-10 lessons
  * Complex chapters may need more granular lessons
  * Simple chapters can have fewer, more comprehensive lessons

Recommended lesson mix (adapt as needed):
- Start with 1-2 VIDEO lessons for overview and key concepts (10-15m each)
- Include ARTICLE lessons for detailed explanations (15-30m each, 800-1200 words)
- End with 1 QUIZ lesson for knowledge check (5-10m)
- Example for 5 lessons: Video (12m) + Article (20m) + Article (20m) + Article (15m) + Quiz (8m) = 75m
- Example for 7 lessons: Video (12m) + Video (10m) + Article (18m) + Article (20m) + Article (18m) + Article (15m) + Quiz (7m) = 100m

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

QUIZ LESSON (Lesson 4):
- Duration: 5-10m
- Content: null
- VideoSearchQuery: null
- Description: "Test your understanding of ${args.keyTopics.join(", ")}"
- Resources: Link to lessons 1-3 for review, if lesson 1 has no transcription, link to lesson 2-3 instead

RULES:
- lessonOrder: 1, 2, 3, 4 (sequential)
- Only article type has markdown content
- Video/quiz types: content must be null
- Each lesson needs 1 specific learning outcome using action verbs
- Prerequisites: Lesson 1 (previous chapters), Lesson 2 (Lesson 1), Lesson 3 (Lessons 1-2), Lesson 4 (Lessons 1-3)

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
