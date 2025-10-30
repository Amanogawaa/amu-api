export const generateCoursePrompt = (args: {
  category: string;
  topic: string;
  level: string;
  duration: string;
  noOfModules: number;
  language: string;
}) => `You are a course design expert. Generate comprehensive course metadata based on the specifications below.

**Input Specifications**:
- Category: ${args.category}
- Topic: ${args.topic}
- Level: ${args.level}
- Total Duration: ${args.duration}
- Number of Modules: ${args.noOfModules}
- Language: ${args.language}

**Output Requirements**:
Return ONLY valid JSON starting with { and ending with }. No markdown blocks, no explanations.

{
  "name": "Professional course title",
  "subtitle": "Engaging one-line tagline (optional, max 80 chars)",
  "description": "Comprehensive 300-500 word description covering: what the course teaches, who it's for, key benefits, and what makes it unique",
  "category": "${args.category}",
  "topic": "${args.topic}",
  "level": "${args.level}",
  "language": "${args.language}",
  "prerequisites": "Clear prerequisite requirements or 'None' for beginners",
  "learning_outcomes": [
    "Specific, measurable outcome using action verbs (e.g., 'Build', 'Implement', 'Analyze')",
    "5-8 outcomes total, each starting with an action verb"
  ],
  "publish": false,
  "duration": "${args.duration}",
  "no_of_modules": ${args.noOfModules},
  "target_audience": "Who this course is designed for (1-2 sentences)",
  "skills_gained": ["skill1", "skill2", "skill3"],
  "banner_url": "/images/banners/${args.topic
    .toLowerCase()
    .replace(/\s+/g, '-')}-banner.jpg",
  "certificate_eligible": ${
    args.duration.includes('h') && parseInt(args.duration) >= 10
  }
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
