import { SYSTEM_PROMPTS } from './system-prompts';
import type { PromptMode, PromptPayload } from './types';

export type CoursePromptMode = PromptMode;

interface CoursePromptArgs {
  category: string;
  topic: string;
  level: string;
  duration: string;
  noOfModules: number;
  language: string;
  userInstructions?: string;
}

const legacyCoursePrompt = (args: CoursePromptArgs): string => {
  const base = `You are a course design expert. Generate comprehensive course metadata based on the specifications below.

**Input Specifications**:
- Category: ${args.category}
- Topic: ${args.topic}
- Level: ${args.level}
- Total Duration: ${args.duration}
- Number of Modules: ${args.noOfModules}
- Language: ${args.language}
`;

  const feedback = args.userInstructions
    ? `\n**IMPORTANT USER FEEDBACK FOR REGENERATION:**\n${args.userInstructions}\n`
    : '';

  return `${base}${feedback}
Return valid JSON only:
{
  "name": "Professional course title",
  "subtitle": "Engaging one-line tagline (optional, max 80 chars)",
  "description": "Comprehensive 150-300 word description covering: what the course teaches, who it's for, key benefits, and what makes it unique",
  "category": "${args.category}",
  "topic": "${args.topic}",
  "level": "${args.level}",
  "language": "${args.language}",
  "prerequisites": "Clear prerequisite requirements or 'None' for beginners",
  "learning_outcomes": [
    "Specific, measurable outcome using action verbs (e.g., 'Build', 'Implement', 'Analyze')",
    "5-8 outcomes total, each starting with an action verb"
  ],
  "publish": false,
  "archive": false,
  "duration": "${args.duration}",
  "no_of_modules": ${args.noOfModules},
  "target_audience": "Who this course is designed for (1-2 sentences)",
  "skills_gained": ["skill1", "skill2", "skill3"],
  "supports_code_playground": true or false
}

**Content Guidelines by Level**:
- **Beginner**: Assume zero prior knowledge. Focus on fundamentals, clear explanations, lots of examples. Prerequisites: "None" or basic computer literacy.
- **Intermediate**: Assume foundational knowledge. Focus on practical application, real-world projects. List specific prerequisite skills.
- **Advanced**: Assume solid experience. Focus on optimization, architecture, best practices, complex scenarios. List advanced prerequisites.

**Learning Outcomes Must**:
- Start with action verbs: Build, Create, Implement, Analyze, Design, Deploy, Optimize, Debug
- Be specific and measurable
- Progress from simple to complex
- Align with the course level
- Be achievable within ${args.duration}

**Quality Checklist**:
- Course name is concise (3-6 words) and professional
- Description is compelling and explains the "why" not just "what"
- Prerequisites are realistic for the target level
- Learning outcomes are specific, not vague (avoid "understand" or "learn about")
- Target audience is clearly defined

**Code Playground Support**:
Set "supports_code_playground" to true ONLY if the course:
- Teaches a vanilla programming language (Python, JavaScript, Java, C++, C, Go, Rust, Ruby, PHP, TypeScript, etc.)
- Does NOT require frameworks (React, Next.js, Vue, Angular, Django, Flask, Spring Boot, etc.)
- Does NOT require external packages/libraries beyond standard library
- Focuses on core programming concepts, algorithms, or data structures
- Can run code in an isolated environment without dependencies

Set to false if the course involves:
- Web frameworks (React, Next.js, Vue, Angular)
- Backend frameworks (Django, Flask, Express, Spring Boot)
- Mobile development (React Native, Flutter, Swift UI)
- Package managers or external dependencies
- Database systems or ORMs
- UI/UX design without coding
- DevOps, Cloud, or Infrastructure topics
`;
};

const systemCoursePrompt = (args: CoursePromptArgs): PromptPayload => {
  const lines = [
    `Generate complete course metadata for the topic "${args.topic}".`,
    `Category: ${args.category}`,
    `Level: ${args.level}`,
    `Total duration: ${args.duration}`,
    `Desired modules: ${args.noOfModules}`,
    `Language: ${args.language}`,
    `Return JSON that satisfies the schema described in the system prompt.`,
  ];

  if (args.userInstructions) {
    lines.push(
      'User feedback to incorporate (honor without changing the schema):',
      args.userInstructions
    );
  }

  return {
    userPrompt: lines.join('\n'),
    systemPrompt: SYSTEM_PROMPTS.COURSE,
  };
};

export const buildCoursePrompt = (
  args: CoursePromptArgs,
  mode: CoursePromptMode = 'system'
): PromptPayload => {
  if (mode === 'legacy') {
    return {
      userPrompt: legacyCoursePrompt(args),
    };
  }

  return systemCoursePrompt(args);
};
