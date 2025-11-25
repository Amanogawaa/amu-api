import { SYSTEM_PROMPTS } from './system-prompts';
import type { PromptIntent, PromptMode, PromptPayload } from './types';

export type ModulePromptMode = PromptMode;

interface ModulePromptArgs {
  courseId: string;
  courseName: string;
  courseDescription: string;
  learningOutcomes: string[];
  level: string;
  duration: string;
  noOfModules: number;
  language: string;
  prerequisites?: string;
  userInstructions?: string;
}

interface BuildModulesPromptOptions {
  mode?: ModulePromptMode;
  intent?: PromptIntent;
}

const legacyModulesPrompt = (
  args: ModulePromptArgs,
  intent: PromptIntent
): string => {
  const intro = `Create ${args.noOfModules} modules for: ${args.courseName}

Course: ${args.courseDescription}
Level: ${args.level} | Duration: ${args.duration} | Language: ${args.language}
Learning Outcomes: ${args.learningOutcomes.join('; ')}
Prerequisites: ${args.prerequisites || 'None specified'}
`;

  const regenNote =
    intent === 'regenerate'
      ? '\n**NOTE:** This is a regeneration request. Keep the same module count/order but refresh the narratives and learning objectives.'
      : '';

  const feedback = args.userInstructions
    ? `\n**USER FEEDBACK:**\n${args.userInstructions}`
    : '';

  return `${intro}${feedback}${regenNote}

Return valid JSON only:
{
  "modules": [
    {
      "moduleOrder": 1,
      "moduleName": "string",
      "moduleDescription": "2-3 sentences explaining what learners will master and why it matters",
      "estimatedDuration": "Xh Ym",
      "estimatedChapterCount": 4,
      "learningObjectives": [
        "Action verb + specific deliverable",
        "3-5 objectives using: Create, Build, Implement, Analyze, Design, Apply"
      ],
      "keySkills": ["skill1", "skill2", "skill3"],
      "prerequisiteModules": []
    }
  ]
}

Design Rules:
- Module 1: Fundamentals & setup (20-25% of total duration)
- Middle modules: Core skills (15-20% each)
- Final module: Advanced topics & integration (15-20%)
- Each module: 3-6 chapters, 4-10 hours
- Total duration must equal ${args.duration} (±10%)
- Prerequisites: Module 1 has empty array, later modules reference previous module names
- Learning objectives must be specific, measurable, and achievable within module duration

Level guidance:
- Beginner: 3-4 modules, foundational focus, gentle curve
- Intermediate: 4-6 modules, theory + practice balance
- Advanced: 5-7 modules, dense technical content, assume prior knowledge`;
};

const systemModulesPrompt = (
  args: ModulePromptArgs,
  intent: PromptIntent
): PromptPayload => {
  const lines = [
    `Generate ${args.noOfModules} modules for the course "${args.courseName}".`,
    `Course summary: ${args.courseDescription}`,
    `Level: ${args.level}`,
    `Total duration: ${args.duration}`,
    `Learning outcomes: ${args.learningOutcomes.join(' | ')}`,
    `Language: ${args.language}`,
    `Prerequisites: ${args.prerequisites || 'None'}`,
    `Ensure total module duration stays within ±10% of ${args.duration}.`,
  ];

  if (intent === 'regenerate') {
    lines.push(
      'This is a regeneration request: keep the same module count and order but refresh descriptions, objectives, and skills.'
    );
  }

  if (args.userInstructions) {
    lines.push('User feedback to honor:', args.userInstructions);
  }

  return {
    userPrompt: lines.join('\n'),
    systemPrompt: SYSTEM_PROMPTS.MODULE,
  };
};

export const buildModulesPrompt = (
  args: ModulePromptArgs,
  options: BuildModulesPromptOptions = {}
): PromptPayload => {
  const mode = options.mode ?? 'system';
  const intent = options.intent ?? 'generate';

  if (mode === 'legacy') {
    return {
      userPrompt: legacyModulesPrompt(args, intent),
    };
  }

  return systemModulesPrompt(args, intent);
};
