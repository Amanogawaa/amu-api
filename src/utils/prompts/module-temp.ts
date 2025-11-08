export const generateModulesPrompt = (args: {
  courseId: string;
  courseName: string;
  courseDescription: string;
  learningOutcomes: string[];
  level: string;
  duration: string;
  noOfModules: number;
  language: string;
  prerequisites: string;
}) => `You are an expert curriculum designer. Create a comprehensive module structure for this course.

**Course Context**:
- Course: ${args.courseName}
- Description: ${args.courseDescription}
- Learning Outcomes: ${args.learningOutcomes.join('; ')}
- Prerequisites: ${args.prerequisites}
- Level: ${args.level}
- Language: ${args.language}
- Total Duration: ${args.duration}
- Required Modules: ${args.noOfModules}

**Output Requirements**:
Return ONLY valid JSON. No markdown blocks, no explanations.

{
  "modules": [
    {
      "moduleOrder": 1,
      "moduleName": "Clear, descriptive module title (e.g., 'JavaScript Fundamentals', 'Backend API Design')",
      "moduleDescription": "2-3 sentences explaining what learners will master in this module and why it matters",
      "estimatedDuration": "Xh Ym format (e.g., 6h 30m)",
      "estimatedChapterCount": 4,
      "learningObjectives": [
        "Create/Build/Implement specific deliverable",
        "Analyze/Evaluate particular concept",
        "Apply/Design defined technique",
        "3-5 objectives total"
      ],
      "keySkills": [
        "Skill 1",
        "Skill 2",
        "Skill 3"
      ],
      "prerequisiteModules": [],
    }
  ]
}

**Module Design Principles**:

1. **Module Count & Scope**:
   - Beginner: ${
     args.level === 'beginner' ? '3-4 modules, foundational focus' : ''
   }
   - Intermediate: ${
     args.level === 'intermediate'
       ? '4-6 modules, balanced theory and practice'
       : ''
   }
   - Advanced: ${
     args.level === 'advanced' ? '5-7 modules, deep technical focus' : ''
   }
   - Each module = major learning milestone (e.g., "Frontend Basics", "State Management")

2. **Duration Distribution**:
   - Total across all modules must equal ${args.duration} (±10%)
   - Module 1: 20-25% of total (foundations take time)
   - Middle modules: 15-20% each (core content)
   - Final module: 15-20% (synthesis and advanced topics)
   - Each module: 4-10 hours typically

3. **Progressive Structure**:
   - Module 1: Fundamentals, environment setup, basic concepts
   - Middle modules: Core skills, practical application, building complexity
   - Final module: Advanced techniques, best practices, real-world integration

4. **Learning Objectives** (3-5 per module):
   - Use strong action verbs: Create, Build, Implement, Deploy, Analyze, Design, Optimize
   - Be specific and measurable
   - Align with course-level learning outcomes
   - Should be achievable within module duration

5. **Prerequisite Chain**:
   - Module 1: Empty array (no prerequisites)
   - Later modules: Reference previous module titles
   - Example: Module 3 might require ["JavaScript Fundamentals", "DOM Manipulation"]

**Level-Specific Guidelines**:
- **Beginner**: 
  - Fewer modules (3-4), more time per module
  - Gentle learning curve
  - Focus: Building confidence, core concepts

- **Intermediate**:
  - Balanced modules (4-6)
  - Mix theory and hands-on practice
  - Focus: Practical skills, problem-solving

- **Advanced**:
  - More modules (5-7), dense content
  - Assume prior knowledge
  - Focus: Best practices, architecture, optimization

**Quality Checklist**:
- Each module title is clear and describes the core focus
- Modules build logically on each other
- Learning objectives are specific and actionable
- Total duration = ${args.duration} (±10%)
- Each module has 3-5 chapters worth of content
- Prerequisite modules are correctly identified

Return only the JSON object with the modules array.`;
