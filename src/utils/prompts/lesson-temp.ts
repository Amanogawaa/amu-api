export const generateLessonsPrompt = (args: {
  chapterId: string;
  chapterTitle: string;
  chapterDescription: string;
  chapterOrder: number;
  learningObjectives: string[];
  keyTopics: string[];
  estimatedDuration: string;
  estimatedLessonCount: number;
  courseName: string;
  level: string;
  language: string;
}) => `You are a course design expert. Create a structured set of lessons for this chapter.

**Course Context**:
- Course: ${args.courseName}
- Level: ${args.level}
- Language: ${args.language}

**Chapter Information**:
- Chapter ${args.chapterOrder}: ${args.chapterTitle}
- Description: ${args.chapterDescription}
- Learning Objectives: ${args.learningObjectives.join('; ')}
- Key Topics: ${args.keyTopics.join(', ')}
- Target Duration: ${args.estimatedDuration}
- Target Lesson Count: ${args.estimatedLessonCount}

**Output Requirements**:
Return ONLY valid JSON. No markdown blocks, no explanations.

{
  "lessons": [
    {
      "lessonOrder": 1,
      "title": "Clear, action-oriented lesson title",
      "type": "video | article | quiz",
      "duration": "Xm format (e.g., 15m, 30m)",
      "description": "2-3 sentence overview: what is covered, why it matters, what students will learn",
      "content": "For article type: comprehensive markdown content. For video type: detailed video script outline. For quiz type: null",
      "videoSearchQuery": "For video type: specific YouTube search query. For others: null",
      "resources": [
        {
          "title": "Resource title",
          "url": "https://example.com or placeholder",
          "type": "documentation | article | tool | github | reference",
          "description": "Why this resource is helpful"
        }
      ],
      "prerequisiteKnowledge": ["concept1", "concept2"]
    }
  ]
}

**Lesson Design Rules**:

1. **Lesson Types Distribution**:
   - 40-50% video lessons (concepts, demonstrations, explanations)
   - 30-40% article lessons (deep dives, reference material, written guides)
   - 10-20% quiz lessons (after every 2-4 content lessons)
   - Include at least ONE quiz for knowledge validation

2. **Lesson Ordering**:
   - Start with foundational concepts (video or article)
   - Progress to application/practice
   - End with quiz to validate learning
   - Example flow: Video → Article → Video → Quiz

3. **Duration Guidelines**:
   - Video lessons: 10-20 minutes each
   - Article lessons: 15-30 minutes (reading + practice)
   - Quiz lessons: 5-15 minutes
   - Total must equal ${args.estimatedDuration} (±5 minutes acceptable)

4. **Content Requirements**:

   **For "article" lessons**:
   - Write 500-1000 word comprehensive content in markdown
   - Use ## for main sections, ### for subsections
   - Include code examples (if applicable) in \`\`\` blocks
   - Add practical examples or analogies
   - Include 2-3 "💡 Pro Tips" or "⚠️ Common Pitfalls"
   - End with "Key Takeaways" bullet list

   **For "video" lessons**:
   - Provide detailed script outline (what the video should cover)
   - Include videoSearchQuery: specific YouTube search terms
   - Example: "React useState hook tutorial ${args.level}"
   - Make search queries specific to avoid irrelevant results

   **For "quiz" lessons**:
   - Set content to null (quiz generated separately)
   - Description should mention which previous lessons it covers

5. **Resources** (1-3 per lesson):
   - Official documentation (highest priority)
   - High-quality tutorials or articles
   - Relevant tools or playgrounds
   - GitHub repositories (for code examples)
   - Avoid random blogs; prefer authoritative sources

6. **Prerequisite Knowledge**:
   - List 2-4 concepts students should know before this lesson
   - Reference earlier lessons if applicable
   - For first lesson: can be empty or course prerequisites

**Level-Specific Content**:
- **Beginner**: More explanations, step-by-step guides, simple examples
- **Intermediate**: Practical applications, real-world scenarios, some theory
- **Advanced**: Minimal hand-holding, complex patterns, performance considerations

**Quality Checklist**:
- Lesson titles start with action verbs when possible
- Each lesson has a clear, focused objective
- Duration is realistic for the content depth
- Resources are relevant and high-quality
- Total duration = ${args.estimatedDuration} ± 5 minutes
- At least one quiz for assessment
- Content flows logically from lesson to lesson

**CRITICAL**: 
- lessonOrder must be sequential: 1, 2, 3, etc.
- For quiz type, content must be null
- videoSearchQuery only for video type, null for others

Return only the JSON object with the lessons array.`;
