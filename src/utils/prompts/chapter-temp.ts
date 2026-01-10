import type { GenerateChaptersRequest } from "@features/chapter/types";
import { SYSTEM_PROMPTS } from "./system-prompts";
import type { PromptIntent, PromptMode, PromptPayload } from "./types";

export type ChapterPromptMode = PromptMode;

interface BuildChaptersPromptOptions {
  mode?: ChapterPromptMode;
  intent?: PromptIntent;
}

const legacyChaptersPrompt = (
  args: GenerateChaptersRequest,
  intent: PromptIntent,
): string => {
  const intro = `Create ${args.noOfChapters} chapters for 

Course: ${args.courseName} (${args.level})
Language: ${args.language}
Course Description: ${args.description}
Learning Outcomes: ${args.learningOutcomes.join("; ")}
Skills to Gain: ${args.skillsGained.join(", ")}
Prerequisites: ${args.prerequisites}
Total Course Duration: ${args.duration}
`;

  const regenNote =
    intent === "regenerate"
      ? "\n**NOTE:** Regenerate existing chapters while keeping the same count/order. Refresh content quality and specificity."
      : "";

  const feedback = args.userInstructions
    ? `\n**USER FEEDBACK:**\n${args.userInstructions}`
    : "";

  return `${intro}${feedback}${regenNote}

Return valid JSON only:
{
  "chapters": [
    {
      "chapterOrder": 1,
      "chapterName": "string",
      "chapterDescription": "2-3 sentences: what this chapter covers and why it's important",
      "estimatedDuration": "Xh Ym",
      "estimatedLessonCount": 4-8,
      "learningObjectives": [
        "Specific, measurable objective 1",
        "Specific, measurable objective 2",
        "Specific, measurable objective 3"
      ],
      "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
      "prerequisites": ["Previous chapter name or None"],
      "practicalApplication": "How learners will apply this knowledge"
    }
  ]
}

Design Rules:
- Each chapter focuses on ONE cohesive topic that progresses the course objectives
- Chapter 1: Introduction and fundamentals (4-5 lessons, lighter content)
- Middle chapters: Core skills and concepts (6-7 lessons, deeper content)
- Final chapter: Integration, advanced application, or capstone-ready skills (5-8 lessons)
- Duration per chapter: 1-3h (scales with lesson count)
- Lesson count flexibility: 1h = 4-5 lessons | 2h = 6-7 lessons | 3h = 8 lessons
- Total duration must equal ${args.duration} (±10%)
- More lessons per chapter = more granular learning, better retention

Learning objectives (2-4 per chapter):
- Use action verbs: Build, Implement, Apply, Create, Analyze, Design, Debug
- Specific and achievable within chapter duration
- Directly support course learning outcomes
- Scale with chapter complexity (simpler chapters = 2-3 objectives, complex = 3-4 objectives)

Key topics (3-6 per chapter):
- Concrete, specific concepts (e.g., "React useState Hook", "CSS Flexbox alignment")
- Avoid broad/vague topics (e.g., "JavaScript Basics", "Web Development")
- More topics for longer chapters with more lessons

Prerequisites:
- Chapter 1: ["None"] or basic prerequisites
- Other chapters: Reference previous chapter names when concepts build on each other
- Keep it simple, only list direct dependencies

Level adjustments:
- Beginner: Gentle pacing, foundational focus, more examples
- Intermediate: Balance theory and practice, assume basic knowledge
- Advanced: Dense technical content, complex scenarios, assume solid foundation`;
};

const systemChaptersPrompt = (
  args: GenerateChaptersRequest,
  intent: PromptIntent,
): PromptPayload => {
  const lines = [
    `Generate ${args.noOfChapters} chapters for the complete course "${args.courseName}".`,
    `Level: ${args.level} | Language: ${args.language} | Duration: ${args.duration}`,
    `Course description: ${args.description}`,
    `Learning outcomes: ${args.learningOutcomes.join(" | ")}`,
    `Skills to gain: ${args.skillsGained.join(", ")}`,
    `Prerequisites: ${args.prerequisites}`,
    "Chapters should have 4-8 lessons each, scaling with complexity and duration.",
    "More lessons = more granular content and better learning progression.",
  ];

  if (intent === "regenerate") {
    lines.push(
      "Regeneration request: keep chapter count/order but refresh content.",
    );
  }

  if (args.userInstructions) {
    lines.push("User feedback:", args.userInstructions);
  }

  return {
    userPrompt: lines.join("\n"),
    systemPrompt: SYSTEM_PROMPTS.CHAPTER,
  };
};

export const buildChaptersPrompt = (
  args: GenerateChaptersRequest,
  options: BuildChaptersPromptOptions = {},
): PromptPayload => {
  const mode = options.mode ?? "system";
  const intent = options.intent ?? "generate";

  if (mode === "legacy") {
    return {
      userPrompt: legacyChaptersPrompt(args, intent),
    };
  }

  return systemChaptersPrompt(args, intent);
};
