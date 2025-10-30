export const generateLessonsPrompt = (args: {
  chapterId: string;
  chapterTitle: string;
  chapterDescription: string;
  chapterOrder: number;
  learningObjectives: string[];
  keyTopics: string[];
  estimatedDuration: string;
  estimatedLessonCount: number;
  moduleName: string;
  courseName: string;
  level: string;
  language: string;
}) => `You are a course design expert. Create structured lessons for this chapter.

**Course Context**:
- Course: ${args.courseName}
- Module: ${args.moduleName}
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
      "type": "video | article | quiz | exercise",
      "duration": "Xm format (e.g., 15m, 30m)",
      "description": "2-3 sentences: what is covered, why it matters, what students will learn",
      "content": "For article: comprehensive markdown. For video: detailed script outline. For quiz/exercise: null",
      "videoSearchQuery": "For video: specific YouTube search query. For others: null",
      "resources": [
        {
          "title": "Resource title",
          "url": "https://example.com or placeholder",
          "type": "documentation | article | tool | github | video | interactive",
          "description": "Why this resource is helpful (1 sentence)"
        }
      ],
      "learningOutcome": "What students will be able to do after this lesson",
      "prerequisites": ["concept1", "concept2"]
    }
  ]
}

**Lesson Design Rules**:

1. **Lesson Types Distribution**:
   - 35-45% video lessons (concepts, demonstrations, explanations)
   - 30-40% article lessons (deep dives, reference material, tutorials)
   - 10-15% quiz lessons (knowledge checks after 2-3 content lessons)
   - 10-15% exercise lessons (hands-on practice, coding challenges)
   - MUST include at least ONE quiz or exercise per chapter

2. **Lesson Ordering Patterns**:
   - **Pattern 1**: Video → Article → Exercise → Quiz
   - **Pattern 2**: Article → Video → Exercise → Quiz
   - **Pattern 3**: Video → Video → Article → Exercise → Quiz
   - Start with foundational content, end with assessment

3. **Duration Guidelines**:
   - Video lessons: 8-15 minutes each (never exceed 20m)
   - Article lessons: 15-25 minutes (reading + practice time)
   - Quiz lessons: 5-10 minutes (3-7 questions)
   - Exercise lessons: 15-30 minutes (hands-on coding/practice)
   - Total must equal ${args.estimatedDuration} (±5 minutes)

4. **Content Requirements**:

   **For "video" lessons**:
   - Provide detailed outline (5-8 key points to cover)
   - Include videoSearchQuery: specific, targeted search terms
   - Format: "${args.chapterTitle} {specific topic} tutorial ${args.level}"
   - Example: "React useState hook tutorial beginner"
   - Focus: Conceptual explanations, demonstrations, walkthroughs

   **For "article" lessons**:
   - Write 600-1200 word comprehensive content in markdown
   - Structure: 
     - ## Introduction (what and why)
     - ## Main Content (2-4 major sections with ### subsections)
     - ## Practical Example
     - ## Key Takeaways
   - Include code examples in \`\`\` blocks (if applicable)
   - Add callouts: 💡 **Pro Tip**, ⚠️ **Common Mistake**, 📝 **Note**
   - Use bullet points, numbered lists for clarity
   - End with 3-5 key takeaways

   **For "quiz" lessons**:
   - Set content to null (generated separately)
   - Description: "Test your understanding of [topics from previous 2-3 lessons]"
   - Should cover content from previous lessons only
   - Place after every 2-4 content lessons

   **For "exercise" lessons**:
   - Set content to null (interactive coding environment)
   - Description: Clear task description
   - Example: "Build a login form with email validation and error handling"
   - Include starter code hints in description
   - Specify expected deliverables

5. **Resources** (2-4 per lesson):
   - **Priority 1**: Official documentation
   - **Priority 2**: High-quality tutorials (MDN, freeCodeCamp, etc.)
   - **Priority 3**: Interactive tools (CodePen, Repl.it, playgrounds)
   - **Priority 4**: GitHub repos (examples, starter templates)
   - **Priority 5**: Video supplements (YouTube, egghead.io)
   - Add description explaining what each resource provides

6. **Learning Outcome** (1 per lesson):
   - Single, specific statement
   - Use action verbs
   - Example: "Implement form validation using HTML5 attributes"
   - Should directly support chapter objectives

7. **Prerequisites**:
   - List 2-4 concepts students should know
   - Reference earlier lessons if needed
   - Example: ["HTML forms basics", "JavaScript events", "DOM manipulation"]
   - First lesson can reference chapter prerequisites

**Lesson Naming Conventions**:
- Use clear, descriptive titles
- Good: "Understanding useState Hook", "Building Dynamic Forms", "Error Handling Patterns"
- Bad: "Lesson 1", "More About React", "Important Concepts"
- Start with verbs when possible: "Creating", "Building", "Implementing", "Understanding"

**Level-Specific Guidelines**:
- **Beginner**:
  - More video lessons (visual learning)
  - Shorter, focused content
  - Step-by-step instructions
  - Frequent quizzes (after every 2 lessons)
  - Lots of examples and analogies

- **Intermediate**:
  - Balanced video and articles
  - Real-world scenarios
  - More exercises (hands-on practice)
  - Quizzes after 3-4 lessons
  - Practical, applicable content

- **Advanced**:
  - More article lessons (self-paced deep reading)
  - Dense, technical content
  - Complex exercises
  - Fewer but harder quizzes
  - Best practices, edge cases, optimization

**Article Lesson Template**:
\`\`\`markdown
# {Lesson Title}

## Introduction
Brief overview (2-3 sentences) explaining what this lesson covers and why it matters.

## {Main Topic 1}
Detailed explanation with examples

### {Subtopic}
Specific details

\`\`\`javascript
// Code example
\`\`\`

💡 **Pro Tip**: Helpful insight

## {Main Topic 2}
Continue with next major concept

## Practical Example
Real-world application or hands-on example

## Key Takeaways
- Takeaway 1
- Takeaway 2
- Takeaway 3
\`\`\`

**Quality Checklist**:
- Lessons flow logically from concept to practice
- Each lesson has a single, clear focus
- Total duration = ${args.estimatedDuration} (±5 minutes)
- At least one assessment (quiz or exercise) included
- Video search queries are specific and targeted
- Article content is comprehensive and well-structured
- Resources are high-quality and relevant
- Learning outcomes are specific and measurable

**CRITICAL**:
- lessonOrder must be sequential: 1, 2, 3, etc.
- For quiz/exercise type, content must be null
- videoSearchQuery only for video type, null for others
- Create exactly ${args.estimatedLessonCount} lessons

Return only the JSON object with the lessons array.`;
