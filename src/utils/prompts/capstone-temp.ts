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
}) => `You are an expert project designer. Create a comprehensive capstone project guideline for this course that allows students to demonstrate their mastery.

**Course Context**:
- Course: ${args.courseName}
- Category: ${args.category}
- Description: ${args.courseDescription}
- Learning Outcomes: ${args.learningOutcomes.join('; ')}
- Skills Gained: ${args.skillsGained.join(', ')}
- Level: ${args.level}
- Language: ${args.language}
- Total Duration: ${args.duration}

**Output Requirements**:
Return ONLY valid JSON starting with { and ending with }. No markdown blocks, no explanations.

{
  "title": "Compelling project title (e.g., 'Build a Full-Stack Task Manager', 'Create a Data Analytics Dashboard')",
  "description": "Comprehensive 2-3 paragraph description explaining: what the project is, why it's valuable, what skills it demonstrates, and how it synthesizes course concepts",
  "objectives": [
    "Specific, measurable objective that demonstrates mastery (e.g., 'Implement user authentication with JWT')",
    "Build/Create/Develop concrete deliverable",
    "Apply/Integrate specific course concepts",
    "5-7 objectives total that cover major course topics"
  ],
  "requiredFeatures": [
    "Core feature 1 that must be implemented",
    "Core feature 2 (specific and measurable)",
    "Core feature 3",
    "5-8 required features total"
  ],
  "suggestedFeatures": [
    "Optional enhancement 1 (for advanced students)",
    "Optional enhancement 2",
    "Optional enhancement 3",
    "3-5 optional features for extra challenge"
  ],
  "technicalRequirements": {
    "languages": ["Primary language", "Additional languages if needed"],
    "frameworks": ["Recommended framework 1", "Framework 2"],
    "tools": ["Tool 1", "Tool 2", "Tool 3"],
    "apis": ["External API if applicable"],
    "database": "Database type if needed (e.g., 'MongoDB', 'PostgreSQL', 'None')"
  },
  "deliverables": [
    "GitHub repository with clean, documented code",
    "README.md with project overview, setup instructions, and screenshots",
    "Working application (deployed or local)",
    "List other specific deliverables"
  ],
  "evaluationCriteria": [
    {
      "name": "Code Quality",
      "description": "Clean, well-organized code following best practices",
      "weight": 20
    },
    {
      "name": "Functionality",
      "description": "All required features working correctly",
      "weight": 30
    },
    {
      "name": "User Experience",
      "description": "Intuitive interface and smooth user interactions",
      "weight": 15
    },
    {
      "name": "Documentation",
      "description": "Clear README and code comments",
      "weight": 15
    },
    {
      "name": "Best Practices",
      "description": "Security, error handling, and performance considerations",
      "weight": 20
    }
  ],
  "estimatedTime": "Realistic time to complete (e.g., '8-12 hours', '2-3 days', '1 week')",
  "difficulty": "${args.level}",
  "resources": [
    "Helpful documentation link or resource 1",
    "Tutorial or guide 2",
    "Reference material 3",
    "3-5 curated resources to help students"
  ],
  "examples": [
    "Example project URL or description 1 (for inspiration)",
    "Example project 2",
    "1-3 example projects for reference"
  ]
}

**Project Design Principles**:

1. **Alignment with Course**:
   - Project must synthesize 80%+ of course learning outcomes
   - Should require applying skills from multiple modules
   - Complexity matches course level and duration

2. **Scope by Level**:
   - **Beginner**: Simple, focused project (e.g., "Build a Todo List App")
     - 5-8 hours to complete
     - 5-6 required features
     - Minimal external dependencies
     - Clear, step-by-step guidance
   
   - **Intermediate**: Moderate complexity (e.g., "Full-Stack Blog Platform")
     - 10-15 hours to complete
     - 7-10 required features
     - Integration of multiple technologies
     - Some problem-solving required
   
   - **Advanced**: Complex, production-ready (e.g., "Microservices E-commerce Platform")
     - 15-25 hours to complete
     - 10-15 required features
     - Advanced architecture patterns
     - Significant design decisions

3. **Required Features**:
   - Must be specific and testable (avoid vague requirements)
   - Cover core concepts from each major module
   - Should be achievable with course knowledge
   - Examples:
     ✅ "Implement user registration with email verification"
     ❌ "Add user management" (too vague)

4. **Evaluation Criteria**:
   - Must total 100% weight
   - 4-6 criteria maximum
   - Each criterion has clear description
   - Focused on demonstrable skills, not subjective judgments

5. **Technical Requirements**:
   - Primary language: ${args.language}
   - Match course stack and tools taught
   - Avoid requiring tools not covered in course
   - Keep dependencies minimal and well-documented

6. **Deliverables**:
   - Always include: GitHub repo, README, working code
   - Be specific about documentation expectations
   - Consider: screenshots, demo video, deployment link

7. **Resources**:
   - Provide official documentation links
   - Include tutorials for complex features
   - Reference best practice guides
   - Avoid overwhelming (3-5 key resources max)

**Category-Specific Guidelines**:
- **Web Development**: Focus on responsive UI, API integration, deployment
- **Data Science**: Emphasize data analysis, visualization, model building
- **Mobile Development**: Native features, offline capability, user experience
- **Backend/APIs**: Authentication, database design, API documentation
- **DevOps**: CI/CD pipelines, containerization, monitoring
- **AI/ML**: Model training, evaluation metrics, practical application

**Quality Standards**:
- Title should be exciting and project-focused (not "Final Project")
- Description should motivate students and explain real-world relevance
- Objectives should use action verbs: Build, Implement, Create, Design, Deploy
- Features should be concrete, not abstract concepts
- Estimated time should be realistic (don't underestimate)
- Examples should be accessible and inspiring

Ensure the capstone project is:
✅ Comprehensive but achievable
✅ Aligned with all major course topics
✅ Appropriate for ${args.level} level
✅ Clearly defined and measurable
✅ Exciting and motivating to build
`;
