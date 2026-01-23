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
      "estimatedLessonCount": "number (let AI decide optimal count based on topic complexity and duration, typically 3-10)",
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
- Let the AI determine the optimal number of lessons (typically 3-10) based on:
  * Chapter complexity and depth required
  * Course duration and topic breadth
  * Natural topic divisions and learning progression
  * Student comprehension and retention needs
- Chapter 1: Introduction and fundamentals (lighter content, fewer lessons if simple)
- Middle chapters: Core skills and concepts (adjust lesson count based on topic complexity)
- Final chapter: Integration, advanced application, or capstone-ready skills
- Duration per chapter: Flexible, should naturally fit the content (typically 1-4h)
- Total duration must equal ${args.duration} (±10%)
- Quality over quantity: Better to have fewer well-crafted lessons than many rushed ones

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
    "Determine optimal lesson count per chapter based on topic complexity, duration, and natural learning flow.",
    "Focus on quality and effective knowledge transfer rather than hitting specific lesson counts.",
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
