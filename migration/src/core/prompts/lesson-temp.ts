export const generateLessonsPrompt = (args: {
  chapterTitle: string;
  chapterDescription: string;
  chapterOrder: number;
  estimatedDuration: string;
  courseName: string;
  level: string;
  language: string;
}) => `You are a course design expert. Based on the following chapter information, generate a structured set of lessons.
    
    **Course Information**:
    - Course Name: ${args.courseName}
    - Level: ${args.level}
    - Language: ${args.language}
    
    **Chapter Information**:
    - Chapter ${args.chapterOrder}: ${args.chapterTitle}
    - Description: ${args.chapterDescription}
    - Estimated Duration: ${args.estimatedDuration}
    
    **Output Requirements**:
    - Return ONLY a JSON object in this structure:
    {
      "lessons": [
        {
          "lessonId": "1.1",
          "title": "Lesson Title",
          "type": "video | article | quiz | assignment",
          "duration": "e.g. 15m",
          "description": "1–2 sentence overview of what this lesson covers",
          "content": "Detailed lesson content for articles (optional)",
          "videoUrl": "Video URL for video lessons (optional)",
          "resources": [
            {
              "title": "Resource Title",
              "url": "https://example.com",
              "type": "pdf | link | doc | image"
            }
          ]
        }
      ]
    }
    
    **Instructions**:
    - Create 3–6 lessons for this chapter.
    - Each lesson must have a type:
      - "video" for conceptual/explainer lessons,
      - "article" for readings/notes,
      - "quiz" for knowledge checks,
      - "assignment" for practice/project.
    - Distribute lesson durations so their total ≈ ${args.estimatedDuration}.
    - Ensure lesson titles are clear, practical, and engaging.
    - Tailor the complexity to match the course level (${args.level}).
    - For "article" type lessons, include detailed content in markdown format.
    - For "video" type lessons, you can suggest placeholder video URLs or leave empty.
    - Include 1-3 relevant resources per lesson when appropriate.
    - lessonId should follow format: "{chapterOrder}.{lessonNumber}" (e.g., "1.1", "1.2", etc.)
    
    Return only the JSON object with the lessons array.`;
