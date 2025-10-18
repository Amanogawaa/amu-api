export const generateCoursePrompt = (args: {
  category: string;
  topic: string;
  level: string;
  duration: string;
  noOfChapters: number;
  language: string;
}) => `You are a course design expert. Generate course metadata (overview information only) based on the specifications below. Do NOT generate chapter content - only the course overview.
  
  **Input Specifications**:
  - Category: ${args.category}
  - Topic: ${args.topic}
  - Level: ${
    args.level
  } (use exactly: "beginner", "intermediate", or "advanced")
  - Total Duration: ${args.duration}
  - Number of Chapters: ${args.noOfChapters}
  - Language: ${args.language}
  
  **Required JSON Structure**:
  Return a JSON object with this exact structure:
  {
    "course": {
      "name": "Course Name Here",
      "subtitle": "Optional subtitle",
      "description": "Course description",
      "category": "${args.category}",
      "topic": "${args.topic}",
      "level": "${args.level}",
      "language": "${args.language}",
      "prerequisites": "Prerequisites text",
      "learning_outcomes": ["outcome1", "outcome2", "..."],
      "duration": "${args.duration}",
      "no_of_chapters": ${args.noOfChapters},
      "publish": false,
      "include_certificate": false,
      "banner_url": "/images/banners/${args.topic
        .toLowerCase()
        .replace(/\s+/g, '-')}-banner.jpg"
    }
  }
  
  **Instructions**:
  - Generate a compelling course name (concise, professional)
  - Create an optional subtitle (brief, catchy tagline)
  - Write a comprehensive description (200-300 words) covering what students will learn
  - List 5-8 specific learning outcomes (what students will be able to do after completion)
  - Include prerequisites as a string (e.g., "Basic understanding of programming concepts" or "None" for beginners)
  - Set publish to true for intermediate/advanced courses, false for beginner courses
  - Set includeCertificate to true for courses longer than 4 hours
  - Ensure all content is appropriate for the specified level and topic
  
  **Level Guidelines**:
  - beginner: Assumes no prior knowledge, focuses on fundamentals
  - intermediate: Assumes basic knowledge, builds practical skills
  - advanced: Assumes solid foundation, covers complex topics and best practices
  
  Return only the course metadata as a JSON object wrapped in {"course": {...}}.`;
