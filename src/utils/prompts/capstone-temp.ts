export const generateCapstonePrompt = (args: {
  courseId: string;
  courseName: string;
  courseDescription: string;
  learningOutcomes: string[];
  level: string;
  duration: string;
  language: string;
  skillsGained: string[];
  category: string;
}) => `Create a capstone project for: ${args.courseName}

Course: ${args.courseDescription}
Category: ${args.category}
Level: ${args.level} | Language: ${args.language}
Outcomes: ${args.learningOutcomes.join('; ')}
Skills: ${args.skillsGained.join(', ')}

Return valid JSON only:
{
  "title": "Project-focused title (e.g., 'Build a Task Manager App')",
  "description": "1 paragraph: what it is, why valuable, skills demonstrated, how it synthesizes course",
  "objectives": [
    "Specific measurable objective (5-7 total)",
    "Use action verbs: Implement, Build, Create, Apply, Integrate"
  ],
  "requiredFeatures": [
    "Core feature 1 (specific and testable)",
    "Core feature 2",
    "5-8 features covering major course topics"
  ],
  "suggestedFeatures": [
    "Optional enhancement 1",
    "3-5 optional features for advanced students"
  ],
  "technicalRequirements": {
    "languages": ["${args.language}"],
    "frameworks": [],
    "tools": [],
    "apis": [],
    "database": "string or 'None'"
  },
  "deliverables": [
    "GitHub repository with documented code",
    "README.md with setup instructions and screenshots",
    "Working application (deployed or local)"
  ],
  "evaluationCriteria": [
    {"name": "Code Quality", "weight": 20},
    {"name": "Functionality", "weight": 30},
    {"name": "User Experience", "weight": 15},
    {"name": "Documentation", "weight": 15},
    {"name": "Best Practices", "weight": 20}
  ],
  "estimatedTime": "Realistic completion time",
  "difficulty": "${args.level}",
  "resources": [
    "Official documentation or tutorial (3-5 curated resources)"
  ],
  "examples": [
    "Example project for inspiration (1-3 examples)"
  ]
}

Project Requirements:
- Must synthesize 80%+ of course learning outcomes
- Scope by level: Beginner (5-8h, 5-6 features) | Intermediate (10-15h, 7-10 features) | Advanced (15-25h, 10-15 features)
- Features must be specific and testable (e.g., "Implement JWT authentication" NOT "Add user management")
- Evaluation criteria must total 100% weight
- Technical requirements should match course stack (primary language: ${
  args.language
})
- Title should be exciting and action-oriented, not "Final Project"

Category focus:
- Web Dev: Responsive UI, API integration, deployment
- Data Science: Analysis, visualization, model building
- Mobile: Native features, offline capability, UX
- Backend: Authentication, database design, API docs
- AI/ML: Model training, evaluation, practical application`;
