export const generateChaptersPrompt = (args: {
  courseId: string;
  title: string;
  description: string;
  learningOutcomes: string[];
  duration: string;
  noOfChapters: number;
  level: string;
  language: string;
}) => `You are a course design expert. Based on the course details below, generate a structured chapter outline.
    
    **Course Information**:
    - Course Name: ${args.title}
    - Description: ${args.description}
    - Learning Outcomes: ${args.learningOutcomes}
    - Total Duration: ${args.duration}
    - Number of Chapters: ${args.noOfChapters}
    - Level: ${args.level}
    - Language: ${args.language}
    
    **Output Requirements**:
    - Return ONLY a JSON object in this structure:
    {
      "chapters": [
        {
          "chapterId": 1,
          "title": "Chapter Title",
          "description": "Brief overview of the chapter (50-100 words)",
          "estimatedDuration": "e.g. 1h 15m",
          "lessons": [
            {
              "lessonId": "1.1",
              "title": "Lesson Title",
              "type": "video | article | quiz | assignment",
              "duration": "e.g. 15m",
              "description": "1-2 sentence overview of what this lesson covers"
            }
          ]
        }
      ]
    }
    
    **Instructions**:
    - Divide the course logically into ${args.noOfChapters} chapters that progressively build knowledge.
    - Each chapter should have 3–6 lessons.
    - Each lesson should specify a type:
      - Use "video" for conceptual/explainer lessons,
      - "article" for readings/notes,
      - "quiz" for knowledge checks,
      - "assignment" for practice/project.
    - Balance the duration so the total across all chapters roughly matches ${args.duration}.
    - Make chapter/lesson titles clear and engaging.
    - Ensure complexity matches the level: 
      - Beginner → fundamentals, gentle intro
      - Intermediate → hands-on skills, practical use cases
      - Advanced → deep dives, best practices, complex applications
    
    Return only the JSON object with the chapters array.`;
