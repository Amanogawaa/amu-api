import { Router } from 'express';
import type { ModuleController } from './controller';
import { validateGenerateModules } from './validation';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { courseOwnershipMiddleware } from '../../middlewares/ownership.middle';

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
     *  @openapi
     * /modules/{moduleId}:
     *   get:
     *     tags:
     *       - Modules
     *     summary: Get a specific module by ID
     *     description: Retrieves a learning module by its unique ID
     *     parameters:
     *       - in: path
     *         name: moduleId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the module
     *     responses:
     *       200:
     *         description: Module retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Module'
     *       404:
     *         description: Module not found
     *       500:
     *         description: Internal server error
     */
    this.route.get('/modules/:moduleId', (req, res, next) =>
      this.controller.getModule(req, res, next)
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
    this.route.post(
      '/modules',
      authMiddleware,
      courseOwnershipMiddleware,
      validateGenerateModules,
      (req, res, next) => this.controller.generateModules(req, res, next)
    );

    /**
     * @openapi
     * /{courseId}/modules:
     *   put:
     *     tags:
     *       - Modules
     *     summary: Regenerate module content while preserving IDs
     *     description: |
     *       Regenerates all module content for a course using AI while maintaining
     *       existing module IDs and relationships. Useful when users want different
     *       content presentation or don't understand the current content.
     *
     *       **Key Features:**
     *       - Preserves module IDs and relationships to chapters/lessons
     *       - Updates content in-place (title, description, learning objectives, etc.)
     *       - Supports optional user instructions for targeted improvements
     *       - Maintains moduleOrder for consistent mapping
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the course whose modules to regenerate
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
     *              courseId:
     *               type: string
     *               example: "course-123"
     *               courseName:
     *                 type: string
     *                 example: "Advanced TypeScript Development"
     *               courseDescription:
     *                 type: string
     *                 example: "Learn advanced TypeScript patterns"
     *               learningOutcomes:
     *                 type: array
     *                 items:
     *                   type: string
     *                 example: ["Build type-safe applications"]
     *               level:
     *                 type: string
     *                 enum: [beginner, intermediate, advanced]
     *                 example: "intermediate"
     *               duration:
     *                 type: string
     *                 example: "20 hours"
     *               noOfModules:
     *                 type: integer
     *                 minimum: 1
     *                 maximum: 20
     *                 example: 5
     *               language:
     *                 type: string
     *                 example: "English"
     *               prerequisites:
     *                 type: string
     *                 example: "Basic JavaScript knowledge"
     *               userInstructions:
     *                 type: string
     *                 description: Optional feedback to guide regeneration
     *                 example: "Make the content more beginner-friendly with more examples"
     *     responses:
     *       200:
     *         description: Modules regenerated successfully
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
     *                   example: "Successfully regenerated 5 modules"
     *                 updated:
     *                   type: integer
     *                   description: Number of modules updated
     *                 errors:
     *                   type: array
     *                   description: Any errors encountered during update
     *       400:
     *         description: Invalid request body
     *       404:
     *         description: No existing modules found for this course
     *       500:
     *         description: Internal server error
     */
    this.route.put(
      '/:courseId/modules',
      authMiddleware,
      courseOwnershipMiddleware,
      validateGenerateModules,
      (req, res, next) => this.controller.regenerateModules(req, res, next)
    );

    /**
     * @openapi
     * /{courseId}/modules:
     *   delete:
     *     tags:
     *       - Modules
     *     summary: Delete all modules for a specific course
     *     description: Deletes all learning modules associated with a course.
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the course
     *     responses:
     *       200:
     *         description: Modules deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Modules for courseId abc123xyz deleted successfully"
     *       404:
     *         description: Course not found
     *       500:
     *         description: Internal server error
     */
    this.route.delete(
      '/:courseId/modules',
      authMiddleware,
      courseOwnershipMiddleware,
      (req, res, next) =>
        this.controller.deleteModulesByCourseId(req, res, next)
    );
  }

  public getRouter(): Router {
    return this.route;
  }
}
