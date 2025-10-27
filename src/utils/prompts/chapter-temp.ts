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
