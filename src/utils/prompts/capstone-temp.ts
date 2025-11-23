/**
 * Generate capstone project prompt using actual course data from the database.
 * This creates better context by using real module and lesson information.
 */
export const generateCapstonePrompt = (context: {
  courseId: string;
  courseName: string;
  courseDescription: string;
  category: string;
  level: string;
  duration: string;
  language: string;
  learningOutcomes: string[];
  skillsGained: string[];
  prerequisites: string[];
  totalModules: number;
  totalLessons: number;
  moduleSummaries: Array<{
    title: string;
    description: string;
    learningOutcomes: string[];
    duration: string;
    order: number;
  }>;
  lessonsByModule: Array<{
    moduleTitle: string;
    lessonCount: number;
    lessons: Array<{
      title: string;
      type: string;
      duration: string;
    }>;
  }>;
  technologiesUsed: string[];
}) => `Create a comprehensive capstone project for: ${context.courseName}

**COURSE OVERVIEW**
Description: ${context.courseDescription}
Category: ${context.category}
Level: ${context.level}
Duration: ${context.duration}
Language: ${context.language}
Total Modules: ${context.totalModules}
Total Lessons: ${context.totalLessons}

**LEARNING OUTCOMES**
${context.learningOutcomes
  .map((outcome, i) => `${i + 1}. ${outcome}`)
  .join('\n')}

**SKILLS GAINED**
${context.skillsGained.join(', ')}

**TECHNOLOGIES USED**
${
  context.technologiesUsed.length > 0
    ? context.technologiesUsed.join(', ')
    : 'Based on course content'
}

**COURSE MODULES**
${context.moduleSummaries
  .map(
    (module) => `
Module ${module.order}: ${module.title}
- ${module.description}
- Duration: ${module.duration}
- Learning Outcomes: ${module.learningOutcomes.join('; ')}
`
  )
  .join('\n')}

**LESSON BREAKDOWN BY MODULE**
${context.lessonsByModule
  .map(
    (moduleData) => `
${moduleData.moduleTitle} (${moduleData.lessonCount} lessons)
Sample lessons: ${moduleData.lessons
      .map((l) => `"${l.title}" (${l.type}, ${l.duration})`)
      .join(', ')}
`
  )
  .join('\n')}

**REQUIREMENTS**
Create a capstone project that:
- Synthesizes 80%+ of the course learning outcomes listed above
- Incorporates skills from multiple modules
- Uses technologies covered in the lessons
- Matches the ${context.level} difficulty level
- Can be completed within a realistic timeframe
- Is DOMAIN-APPROPRIATE for ${context.language} and ${context.category}

**DOMAIN-SPECIFIC GUIDELINES**
For low-level languages (C, C++, Rust):
  - Focus on system-level projects: file systems, data structures, algorithms
  - Examples: Banking system, File compression, Shell, Memory allocator, Mini database
  - Emphasize: Memory management, pointers, file I/O, data structures
  
For scripting languages (Python, JavaScript, Ruby):
  - Focus on automation, web apps, data processing
  - Examples: Web scraper, Automation tool, API, Data analyzer
  - Emphasize: Libraries/frameworks, API integration, data handling

For enterprise languages (Java, C#):
  - Focus on business applications, desktop apps
  - Examples: Inventory system, CRM, Desktop application
  - Emphasize: OOP principles, design patterns, GUI

For data/ML languages (Python with libraries):
  - Focus on data analysis, ML models, visualization
  - Examples: Predictive model, Data dashboard, Recommender system
  - Emphasize: Data preprocessing, model training, visualization

Return valid JSON only:
{
  "title": "Project-focused title matching the domain (e.g., 'Build a Banking System in C' for C programming, 'E-commerce API' for backend, 'Stock Price Predictor' for ML)",
  "description": "1-2 paragraphs: what it is, why valuable, skills demonstrated, how it synthesizes course content from the modules above. Make it domain-appropriate.",
  "objectives": [
    "Specific measurable objective referencing actual course modules (5-7 total)",
    "Use action verbs: Implement, Build, Create, Apply, Integrate, Demonstrate"
  ],
  "gettingStarted": {
    "prerequisites": ["Software/tools needed before starting", "Knowledge requirements from the course"],
    "setupInstructions": [
      "Step 1: Environment setup (IDE, compiler, libraries)",
      "Step 2: Project structure creation",
      "Step 3: Initial configuration",
      "4-6 clear setup steps"
    ],
    "recommendedApproach": "Suggested order to tackle the project (e.g., 'Start with data structures, then implement core logic, finally add UI')"
  },
  "implementationRoadmap": [
    {
      "phase": "Phase 1: Foundation",
      "duration": "Estimated time",
      "tasks": ["Core task 1", "Core task 2"],
      "modules": ["Which course modules to reference"]
    },
    {
      "phase": "Phase 2: Core Features",
      "duration": "Estimated time", 
      "tasks": ["Feature implementation tasks"],
      "modules": ["Relevant modules"]
    },
    {
      "phase": "Phase 3: Enhancement",
      "duration": "Estimated time",
      "tasks": ["Advanced features"],
      "modules": ["Advanced modules used"]
    }
  ],
  "requiredFeatures": [
    "Core feature 1 (specific, testable, related to course modules, domain-appropriate)",
    "Core feature 2 (reference specific technologies from the course)",
    "5-8 features covering major course topics and modules",
    "For C: file I/O, data structures, memory management",
    "For web: CRUD operations, authentication, database",
    "For ML: data preprocessing, model training, evaluation"
  ],
  "suggestedFeatures": [
    "Optional enhancement 1 (advanced topics from later modules)",
    "3-5 optional features for students who want to go beyond"
  ],
  "technicalRequirements": {
    "languages": ["${context.language}"],
    "frameworks": ["Based on course content - extract from modules. Leave empty if not applicable (e.g., pure C projects)"],
    "tools": ["Domain-specific tools: Git, IDE/Editor, compiler/interpreter, debugger, etc."],
    "apis": ["If applicable based on course lessons"],
    "database": "Specify if course covered databases. For C: 'File-based storage' or 'None'. For web: 'PostgreSQL/MongoDB/etc.'"
  },
  "projectStructure": {
    "description": "Recommended file/folder organization",
    "example": "For C: src/, include/, tests/, docs/. For web: client/, server/, database/. For Python: src/, tests/, data/, models/"
  },
  "deliverables": [
    "GitHub repository with well-documented code",
    "README.md with setup instructions, usage guide, and screenshots/output examples",
    "For compiled languages: Executable or build instructions",
    "For web: Deployed link or local setup guide",
    "For ML: Jupyter notebook or script + results visualization",
    "Documentation of how each module's learning was applied",
    "Test cases or usage examples"
  ],
  "evaluationCriteria": [
    {"name": "Code Quality & Organization", "weight": 20, "description": "Clean code, proper structure, comments, following ${
      context.language
    } best practices"},
    {"name": "Feature Completeness", "weight": 30, "description": "All required features implemented and working correctly"},
    {"name": "Problem Solving", "weight": 15, "description": "Effective algorithms, proper data structures, efficient solutions"},
    {"name": "Documentation", "weight": 15, "description": "Clear README, setup instructions, code comments, usage guide"},
    {"name": "Best Practices", "weight": 20, "description": "Domain-specific practices: memory management for C, security for web, data validation for ML, error handling"}
  ],
  "commonChallenges": [
    "Challenge students might face and how to overcome it",
    "Reference to specific course modules for help",
    "3-4 common pitfalls and solutions"
  ],
  "estimatedTime": "Realistic completion time based on course duration and ${
    context.level
  } level: Beginner (5-10h) | Intermediate (10-20h) | Advanced (20-30h)",
  "difficulty": "${context.level}",
  "resources": [
    "Official ${context.language} documentation",
    "Relevant framework/library docs used in course",
    "Domain-specific resources (e.g., for C: 'The C Programming Language by K&R', for web: 'MDN Web Docs')",
    "3-5 curated resources that extend course knowledge"
  ],
  "examples": [
    "Example project URL or description that demonstrates the expected scope (domain-appropriate)",
    "For C: GitHub repos of similar systems",
    "For web: Live demos of similar apps",
    "For ML: Kaggle notebooks or research papers",
    "1-3 inspiration examples at similar skill level"
  ],
  "moduleMapping": [
    {"moduleName": "Module name from above", "skills": ["Skill 1", "Skill 2"], "application": "How these skills are used in the capstone"}
  ]
}

**QUALITY CHECKLIST**
- ✓ Project synthesizes content from all ${context.totalModules} modules
- ✓ Features are specific and testable (e.g., "Implement JWT authentication" NOT "Add user management")
- ✓ Evaluation criteria weights total exactly 100%
- ✓ Technical requirements match technologies from course lessons
- ✓ Title is exciting and action-oriented, not generic "Final Project"
- ✓ Scope matches ${context.level} level and ${context.duration} course duration
- ✓ moduleMapping shows clear connection between course content and capstone requirements

**CATEGORY-SPECIFIC FOCUS**
${getCategoryFocus(context.category)}
`;

function getCategoryFocus(category: string): string {
  const focuses: Record<string, string> = {
    'Web Development':
      '- Responsive UI/UX design\n- API integration and data management\n- Deployment to production environment\n- Performance optimization\n- Project examples: E-commerce site, Social media platform, Task manager',
    'Data Science':
      '- Data cleaning and preprocessing\n- Statistical analysis and visualization\n- Model building and evaluation\n- Insights presentation\n- Project examples: Sales forecasting, Customer segmentation, Sentiment analysis',
    'Mobile Development':
      '- Native mobile features (camera, GPS, notifications)\n- Offline capability and data persistence\n- Mobile UX best practices\n- App store deployment\n- Project examples: Fitness tracker, Chat app, Expense tracker',
    'Backend Development':
      '- RESTful API design\n- Authentication and authorization\n- Database schema design\n- API documentation (Swagger/OpenAPI)\n- Project examples: Blog API, E-commerce backend, User management system',
    'AI/Machine Learning':
      '- Model training and hyperparameter tuning\n- Model evaluation metrics\n- Practical real-world application\n- Results visualization\n- Project examples: Image classifier, Recommendation engine, Price predictor',
    'Systems Programming':
      '- Memory management and pointers\n- File I/O and data structures\n- Process management and concurrency\n- Performance optimization\n- Project examples: Banking system, File compression tool, Shell implementation, Mini database',
    'Game Development':
      '- Game loop and state management\n- Collision detection and physics\n- Asset management and rendering\n- User input handling\n- Project examples: 2D platformer, Puzzle game, RPG battle system',
    DevOps:
      '- CI/CD pipeline setup\n- Container orchestration\n- Infrastructure as code\n- Monitoring and logging\n- Project examples: Automated deployment system, Container management tool',
    Cybersecurity:
      '- Encryption and hashing\n- Authentication mechanisms\n- Vulnerability scanning\n- Secure coding practices\n- Project examples: Password manager, Network scanner, Encryption tool',
    'Desktop Applications':
      '- GUI design and event handling\n- Local data persistence\n- Cross-platform compatibility\n- Performance and responsiveness\n- Project examples: Text editor, Media player, File organizer, Calculator',
  };

  return (
    focuses[category] ||
    '- Apply best practices from the course\n- Demonstrate real-world application\n- Show technical depth and breadth\n- Create a project that solves a practical problem'
  );
}
