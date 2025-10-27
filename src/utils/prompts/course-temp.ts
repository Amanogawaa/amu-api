// export const generateCoursePrompt = (args: {
//   category: string;
//   topic: string;
//   level: string;
//   duration: string;
//   noOfChapters: number;
//   language: string;
// }) => `You are a course design expert. Generate course metadata (overview information only) based on the specifications below. Do NOT generate chapter content - only the course overview.

//   **Input Specifications**:
//   - Category: ${args.category}
//   - Topic: ${args.topic}
//   - Level: ${
//     args.level
//   } (use exactly: "beginner", "intermediate", or "advanced")
//   - Total Duration: ${args.duration}
//   - Number of Chapters: ${args.noOfChapters}
//   - Language: ${args.language}

//   **Required JSON Structure**:
//   Return a JSON object with this exact structure:
//   {
//     "course": {
//       "name": "Course Name Here",
//       "subtitle": "Optional subtitle",
//       "description": "Course description",
//       "category": "${args.category}",
//       "topic": "${args.topic}",
//       "level": "${args.level}",
//       "language": "${args.language}",
//       "prerequisites": "Prerequisites text",
//       "learning_outcomes": ["outcome1", "outcome2", "..."],
//       "duration": "${args.duration}",
//       "no_of_chapters": ${args.noOfChapters},
//       "publish": false,
//       "include_certificate": false,
//       "banner_url": "/images/banners/${args.topic
//         .toLowerCase()
//         .replace(/\s+/g, '-')}-banner.jpg"
//     }
//   }

//   **Instructions**:
//   - Generate a compelling course name (concise, professional)
//   - Create an optional subtitle (brief, catchy tagline)
//   - Write a comprehensive description (200-300 words) covering what students will learn
//   - List 5-8 specific learning outcomes (what students will be able to do after completion)
//   - Include prerequisites as a string (e.g., "Basic understanding of programming concepts" or "None" for beginners)
//   - Set publish to false for intermediate/advanced courses, false for beginner courses
//   - Set includeCertificate to fallse for courses longer than 4 hours
//   - Ensure all content is appropriate for the specified level and topic
//   - Set all boolean fields to false by default unless specified otherwise

//   **Level Guidelines**:
//   - beginner: Assumes no prior knowledge, focuses on fundamentals
//   - intermediate: Assumes basic knowledge, builds practical skills
//   - advanced: Assumes solid foundation, covers complex topics and best practices

//   Return only the course metadata as a JSON object wrapped in {"course": {...}}.`;

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
