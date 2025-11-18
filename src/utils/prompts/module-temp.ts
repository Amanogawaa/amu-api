export const generateModulesPrompt = (args: {
  courseId: string;
  courseName: string;
  courseDescription: string;
  learningOutcomes: string[];
  level: string;
  duration: string;
  noOfModules: number;
  language: string;
}) => `Create ${args.noOfModules} modules for: ${args.courseName}

Course: ${args.courseDescription}
Level: ${args.level} | Duration: ${args.duration} | Language: ${args.language}
Learning Outcomes: ${args.learningOutcomes.join('; ')}

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
