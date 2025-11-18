export const generateChaptersPrompt = (args: {
  moduleId: string;
  moduleName: string;
  moduleDescription: string;
  moduleLearningObjectives: string[];
  moduleKeySkills: string[];
  estimatedDuration: string;
  estimatedChapterCount: number;
  courseName: string;
  level: string;
  moduleOrder: number;
}) => `Create ${args.estimatedChapterCount} chapters for Module ${
  args.moduleOrder
}: ${args.moduleName}

Course: ${args.courseName} (${args.level})
Module: ${args.moduleDescription}
Objectives: ${args.moduleLearningObjectives.join('; ')}
Skills: ${args.moduleKeySkills.join(', ')}
Duration: ${args.estimatedDuration}

Return valid JSON only:
{
  "chapters": [
    {
      "chapterOrder": 1,
      "title": "string",
      "description": "100-150 words: topics covered, why it matters, how it connects to objectives, what students will do",
      "estimatedDuration": "Xh Ym",
      "estimatedLessonCount": 4,
      "learningObjectives": [
        "Specific objective 1",
        "Specific objective 2",
        "Specific objective 3"
      ],
      "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
      "prerequisites": ["Previous chapter or concept"],
      "practicalApplication": "1-2 sentences on how students apply this knowledge"
    }
  ]
}

Design Rules:
- Each chapter = ONE focused concept (e.g., "useState Hook", "CSS Grid", "API Authentication")
- Chapter 1: Intro to module topic, basics
- Middle: Deep dives into specific aspects  
- Final: Integration, advanced techniques, real-world use
- Duration: 45m-2h per chapter (shorter for intro, longer for core concepts)
- Total must equal ${args.estimatedDuration} (±10%)
- Lesson count: 30-45m chapters = 2-3 lessons | 1-1.5h = 4-5 lessons | 1.5-2h = 5-6 lessons

Learning objectives (1-3 per chapter):
- More specific than module objectives
- Use: Explain, Implement, Apply, Compare, Create, Debug
- Must be achievable within chapter duration
- Support module learning objectives

Key topics (1-3 per chapter):
- Granular concepts, not broad categories
- Example: "Flexbox container properties" NOT "CSS Layouts"

Level adjustments:
- Beginner: 45m-1h chapters, gentle pacing, step-by-step
- Intermediate: 1h-1.5h chapters, theory + practice mix
- Advanced: 1h-2h chapters, dense content, assume knowledge`;
