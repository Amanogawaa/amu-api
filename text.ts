export const generateCoursePrompt = (args: {
  category: string;
  topic: string;
  level: string;
  duration: string;
  noOfChapters: number;
  language: string;
}) => `You are a course design expert. Generate comprehensive course metadata based on the specifications below.

**Input Specifications**:
- Category: ${args.category}
- Topic: ${args.topic}
- Level: ${args.level}
- Total Duration: ${args.duration}
- Number of Chapters: ${args.noOfChapters}
- Language: ${args.language}

**Output Requirements**:
Return ONLY valid JSON starting with { and ending with }. No markdown blocks, no explanations.

{
  "name": "Professional course title",
  "subtitle": "Engaging one-line tagline (optional, max 80 chars)",
  "description": "Comprehensive 200-300 word description covering: what the course teaches, who it's for, key benefits, and what makes it unique",
  "category": "${args.category}",
  "topic": "${args.topic}",
  "level": "${args.level}",
  "language": "${args.language}",
  "prerequisites": "Clear prerequisite requirements or 'None' for beginners",
  "learning_outcomes": [
    "Specific, measurable outcome using action verbs (e.g., 'Build', 'Implement', 'Analyze')",
    "5-8 outcomes total, each starting with an action verb"
  ],
  "duration": "${args.duration}",
  "no_of_chapters": ${args.noOfChapters},
  "targetAudience": "Who this course is designed for (1-2 sentences)",
  "skills_gained": ["skill1", "skill2", "skill3"],
  "banner_url": "/images/banners/${args.topic
    .toLowerCase()
    .replace(/\s+/g, '-')}-banner.jpg"
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
- Course name is concise (3-8 words) and professional
- Description is compelling and explains the "why" not just "what"
- Prerequisites are realistic for the target level
- Learning outcomes are specific, not vague (avoid "understand" or "learn about")
- Target audience is clearly defined

Return only the JSON object.`;

export const modulePrompt = (
  courseName: string,
  courseDescription: string,
  learningOutcomes: string[],
  targetLevel: string,
  estimatedDuration: string
) => `
You are an expert curriculum designer creating learning modules for an online course platform.

**Task**: Generate comprehensive learning modules for the following course:

**Course Details:**
- Name: ${courseName}
- Description: ${courseDescription}
- Target Level: ${targetLevel}
- Total Course Duration: ${estimatedDuration}
- Learning Outcomes:
${learningOutcomes.map((outcome, i) => `  ${i + 1}. ${outcome}`).join('\n')}

**Requirements:**

1. **Module Count**: Generate 4-8 modules depending on course complexity and duration
   - Beginner courses: 4-5 modules
   - Intermediate courses: 5-7 modules
   - Advanced courses: 6-8 modules

2. **Module Structure**: Each module must represent a major learning block that:
   - Groups related concepts around a core skill or knowledge area
   - Has clear learning objectives (3-5 objectives per module)
   - Builds progressively on previous modules
   - Includes estimated duration (4-8 hours per module)
   - Contains 3-5 chapters

3. **Module Content**:
   - **Title**: Clear, descriptive name (e.g., "HTML Fundamentals", "Async JavaScript Patterns")
   - **Description**: 2-3 sentences explaining what learners will master
   - **Learning Objectives**: Specific, measurable outcomes using action verbs (create, analyze, implement, design)
   - **Estimated Duration**: Realistic time commitment in hours and minutes (e.g., "6h 30m")
   - **Estimated Chapter Count**: 3-5 chapters per module
   - **Prerequisite Modules**: Array of module titles that should be completed first (empty for Module 1)
   - **Capstone Project**: Hands-on project that integrates module concepts
     - Title: Project name
     - Description: What the learner will build
     - Requirements: 3-5 key deliverables
     - Estimated Time: Project duration (1-3 hours)

4. **Progressive Difficulty**:
   - Module 1: Foundation concepts, basic terminology
   - Middle modules: Core skills, practical application
   - Final modules: Advanced techniques, integration, best practices

5. **Logical Flow**: Each module should naturally lead to the next:
   - Early modules: Prerequisites and fundamentals
   - Middle modules: Applied skills and deeper concepts
   - Later modules: Advanced patterns and real-world scenarios

**Output Format**: Return a JSON array of module objects matching this structure:

[
  {
    "moduleOrder": 1,
    "title": "Module title",
    "description": "What learners will master in this module",
    "learningObjectives": [
      "Create specific deliverable",
      "Analyze particular concept",
      "Implement defined technique"
    ],
    "estimatedDuration": "6h 30m",
    "estimatedChapterCount": 4,
    "prerequisiteModules": [],
    "capstoneProject": {
      "title": "Project name",
      "description": "What the learner will build",
      "requirements": [
        "Implement feature X",
        "Use technique Y",
        "Apply pattern Z"
      ],
      "estimatedTime": "2h 30m"
    }
  }
]

**Important Guidelines:**
- Use clear, accessible language appropriate for ${targetLevel} learners
- Make learning objectives specific and actionable
- Ensure modules are balanced in scope and duration
- Create capstone projects that are challenging but achievable
- Consider real-world applications in module descriptions
- Total module durations should sum to approximately ${estimatedDuration}
`;

export const generateChaptersPrompt = (args: {
  courseId: string;
  courseName: string;
  description: string;
  learningOutcomes: string[];
  duration: string;
  noOfChapters: string;
  level: string;
  language: string;
  prerequisites: string;
}) => `You are a course design expert. Create a progressive chapter structure that builds knowledge systematically.

**Course Context**:
- Course: ${args.courseName}
- Description: ${args.description}
- Learning Outcomes: ${args.learningOutcomes.join('; ')}
- Prerequisites: ${args.prerequisites}
- Level: ${args.level}
- Language: ${args.language}
- Total Duration: ${args.duration}
- Required Chapters: ${args.noOfChapters}

**Output Requirements**:
Return ONLY valid JSON. No markdown blocks, no explanations.

{
  "chapters": [
    {
      "chapterOrder": 1,
      "title": "Clear, engaging chapter title",
      "description": "Comprehensive 100-150 word description covering: what topics are covered, why this chapter matters, how it builds on previous chapters (if applicable), and what students will be able to do after completion",
      "estimatedDuration": "Xh Ym format (e.g., 1h 30m or 45m)",
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
      "estimatedLessonCount": 4
    }
  ]
}

**Chapter Design Principles**:

1. **Progressive Structure**:
   - Chapter 1: Foundations and setup (if applicable)
   - Middle chapters: Core concepts and skills building progressively
   - Final chapter: Integration, real-world application, or capstone project

2. **Duration Distribution**:
   - Total across all chapters must approximately equal ${args.duration}
   - Earlier chapters may be shorter (foundations)
   - Middle chapters typically longest (core content)
   - Consider: 1 hour = roughly 3-4 lessons

3. **Learning Objectives** (3-5 per chapter):
   - Use action verbs: Explain, Implement, Apply, Compare, Analyze, Create
   - Should be achievable within the chapter's scope
   - Should collectively lead to course learning outcomes

4. **Key Topics**:
   - List 3-6 main topics/concepts covered
   - Be specific, not vague
   - Show clear progression between chapters

5. **Estimated Lesson Count**:
   - Based on chapter duration and complexity
   - Typical: 3-6 lessons per chapter
   - Shorter chapters (< 1h): 3-4 lessons
   - Longer chapters (> 1.5h): 5-6 lessons

**Level-Specific Guidelines**:
- **Beginner**: More foundational chapters, gentler pace, more examples
- **Intermediate**: Balance theory and practice, include projects
- **Advanced**: Dense content, complex topics, focus on mastery

**Quality Checklist**:
- Each chapter has a clear, focused theme
- Chapters build logically on each other
- No topic overlap between chapters
- Total duration ≈ ${args.duration} (±10%)
- Learning objectives are specific and measurable
- Chapter titles are descriptive and engaging

Return only the JSON object with the chapters array.`;
