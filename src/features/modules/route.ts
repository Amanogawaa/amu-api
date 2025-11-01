import { Router } from 'express';
import type { ModuleController } from './controller';
import { validateGenerateModules } from './validation';

export class ModuleRoute {
  public route: Router;
  private controller: ModuleController;

  constructor(moduleController: ModuleController) {
    this.controller = moduleController;
    this.route = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /{courseId}/modules:
     *   get:
     *     tags:
     *       - Modules
     *     summary: Get all modules for a specific course
     *     description: Retrieves all learning modules associated with a course, ordered by moduleOrder
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the course
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *         description: Maximum number of modules to return
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           minimum: 0
     *         description: Number of modules to skip for pagination
     *     responses:
     *       200:
     *         description: List of modules retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 results:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Module'
     *                 count:
     *                   type: integer
     *                 next:
     *                   type: integer
     *                   nullable: true
     *                 previous:
     *                   type: integer
     *                   nullable: true
     *       404:
     *         description: Course not found
     *       500:
     *         description: Internal server error
     */
    this.route.get('/:courseId/modules', (req, res, next) =>
      this.controller.getModules(req, res, next)
    );

    /**
     * @openapi
     * /modules:
     *   post:
     *     tags:
     *       - Modules
     *     summary: Generate modules for a course using AI
     *     description: |
     *       Creates a complete module structure for a course using AI.
     *       Generates module titles, descriptions, learning objectives, and capstone projects.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - courseId
     *               - courseName
     *               - courseDescription
     *               - learningOutcomes
     *               - level
     *               - duration
     *               - noOfModules
     *               - language
     *               - prerequisites
     *             properties:
     *               courseId:
     *                 type: string
     *                 description: The ID of the course
     *                 example: "abc123xyz"
     *               courseName:
     *                 type: string
     *                 description: Name of the course
     *                 example: "Advanced TypeScript Development"
     *               courseDescription:
     *                 type: string
     *                 description: Full description of the course
     *                 example: "Learn advanced TypeScript patterns and best practices"
     *               learningOutcomes:
     *                 type: array
     *                 items:
     *                   type: string
     *                 description: Array of course learning outcomes
     *                 example: ["Build type-safe applications", "Implement advanced generics"]
     *               level:
     *                 type: string
     *                 enum: [beginner, intermediate, advanced]
     *                 description: Difficulty level
     *                 example: "intermediate"
     *               duration:
     *                 type: string
     *                 description: Total course duration
     *                 example: "20 hours"
     *               noOfModules:
     *                 type: integer
     *                 minimum: 1
     *                 maximum: 20
     *                 description: Number of modules to generate
     *                 example: 5
     *               language:
     *                 type: string
     *                 description: Course language
     *                 example: "English"
     *               prerequisites:
     *                 type: string
     *                 description: Course prerequisites
     *                 example: "Basic JavaScript knowledge"
     *     responses:
     *       201:
     *         description: Modules generated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Module'
     *                 message:
     *                   type: string
     *                   example: "Modules generated successfully"
     *       400:
     *         description: Invalid request body
     *       404:
     *         description: Course not found
     *       500:
     *         description: Internal server error
     */
    this.route.post('/modules', validateGenerateModules, (req, res, next) =>
      this.controller.generateModules(req, res, next)
    );
  }

  public getRouter(): Router {
    return this.route;
  }
}
