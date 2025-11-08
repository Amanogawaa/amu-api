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
  language: string;
  moduleOrder: number;
}) => `You are a course design expert. Create detailed chapters for this module.

**Course Context**:
- Course: ${args.courseName}
- Level: ${args.level}
- Language: ${args.language}

**Module Context**:
- Module ${args.moduleOrder}: ${args.moduleName}
- Description: ${args.moduleDescription}
- Learning Objectives: ${args.moduleLearningObjectives.join('; ')}
- Key Skills: ${args.moduleKeySkills.join(', ')}
- Module Duration: ${args.estimatedDuration}
- Target Chapter Count: ${args.estimatedChapterCount}

**Output Requirements**:
Return ONLY valid JSON. No markdown blocks, no explanations.

{
  "chapters": [
    {
      "chapterOrder": 1,
      "title": "Clear, focused chapter title",
      "description": "100-150 words: what topics are covered, why this chapter matters, how it connects to module objectives, what students will be able to do",
      "estimatedDuration": "Xh Ym format (e.g., 1h 30m or 45m)",
      "estimatedLessonCount": 4,
      "learningObjectives": [
        "Specific objective 1",
        "Specific objective 2",
        "Specific objective 3"
      ],
      "keyTopics": [
        "Topic 1",
        "Topic 2",
        "Topic 3"
      ],
      "prerequisites": [
        "Previous chapter or concept needed"
      ],
      "practicalApplication": "1-2 sentences on how students will apply this knowledge"
    }
  ]
}

**Chapter Design Principles**:

1. **Chapter Scope**:
   - Each chapter = ONE focused topic or concept
   - Example: "useState Hook", "CSS Grid Layout", "API Authentication"
   - NOT: "React Hooks Overview" (too broad - should be multiple chapters)

2. **Duration Distribution**:
   - Total across all chapters must equal ${args.estimatedDuration} (±10%)
   - Typical chapter: 45m - 2h
   - Shorter chapters (< 1h): Introductory or supplementary content
   - Longer chapters (> 1.5h): Core concepts with practice

3. **Progressive Structure Within Module**:
   - Chapter 1: Introduction to module topic, basic concepts
   - Middle chapters: Deep dives into specific aspects
   - Final chapter: Integration, advanced techniques, real-world application  

4. **Learning Objectives** (1-3 per chapter):
   - More specific than module objectives
   - Use verbs: Explain, Implement, Apply, Compare, Create, Debug
   - Achievable within chapter duration
   - Directly support module learning objectives

5. **Key Topics** (1-3 per chapter):
   - Specific concepts covered
   - Bullet-point level detail
   - Example: Instead of "CSS Layouts", use "Flexbox container properties", "Flex item behavior", "Common layout patterns"

6. **Estimated Lesson Count**:
   - Based on chapter duration and topic complexity
   - 30-45 min chapters: 2-3 lessons
   - 1-1.5 hour chapters: 4-5 lessons
   - 1.5-2 hour chapters: 5-6 lessons

7. **Prerequisites**:
   - List previous chapters from THIS module, or
   - Core concepts from previous modules
   - Keep it specific (not "basic programming knowledge")

8. **Practical Application**:
   - How will students USE this knowledge?
   - Example: "Build responsive navigation bars using Flexbox"
   - Connects theory to practice

**Chapter Naming Conventions**:
- Start with clear nouns or verbs
- Good: "Building Forms with React", "Async/Await Patterns", "Git Branching Strategies"
- Bad: "More About React", "Advanced Stuff", "Other Concepts"

**Level-Specific Guidelines**:
- **Beginner**: 
  - Shorter chapters (45m - 1h)
  - More foundational content
  - Step-by-step progression
  - ${args.estimatedChapterCount} chapters with gentle pacing

- **Intermediate**:
  - Balanced chapters (1h - 1.5h)
  - Mix theory and practice
  - Real-world scenarios
  - ${args.estimatedChapterCount} chapters with practical focus

- **Advanced**:
  - Dense chapters (1h - 2h)
  - Assume prior knowledge
  - Complex topics, edge cases
  - ${args.estimatedChapterCount} chapters with depth

**Quality Checklist**:
- Each chapter has a single, clear focus
- Chapter titles are descriptive and specific
- Chapters build logically within the module
- Total duration = ${args.estimatedDuration} (±10%)
- Learning objectives are specific and measurable
- Key topics are granular, not vague
- Prerequisites are clearly identified
- Practical applications are concrete

**Important**: 
- Create exactly ${args.estimatedChapterCount} chapters
- Ensure smooth progression from chapter to chapter
- Each chapter should feel complete but also flow to the next

Return only the JSON object with the chapters array.`;
