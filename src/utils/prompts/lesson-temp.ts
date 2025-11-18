export const generateLessonsPrompt = (args: {
  chapterId: string;
  chapterName: string;
  chapterDescription: string;
  chapterOrder: number;
  learningObjectives: string[];
  keyTopics: string[];
  estimatedDuration: string;
  moduleName: string;
  courseName: string;
  level: string;
  language: string;
}) => `Create exactly 4 lessons for Chapter ${args.chapterOrder}: ${
  args.chapterName
}

Context: ${args.chapterDescription}
Topics: ${args.keyTopics.join(', ')}
Duration: ${args.estimatedDuration}

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

REQUIRED STRUCTURE (must follow exactly):
Lesson 1: VIDEO - Introduction/overview (10-12m)
Lesson 2: ARTICLE - Core concepts/fundamentals (20-25m)
Lesson 3: ARTICLE - Advanced usage/patterns (20-25m)
Lesson 4: QUIZ - Knowledge check (5-10m)

Total must equal ${args.estimatedDuration} (±5m).

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
- Description: "Test your understanding of ${args.keyTopics.join(', ')}"
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
