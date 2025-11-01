import { Router } from 'express';
import type { CourseController } from './controller';
import { validateCourseId, validateGenerateCourse } from './validation';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { courseOwnershipMiddleware } from '../../middlewares/ownership.middle';

export class CourseRoute {
  public router: Router;
  private controller: CourseController;

  constructor(coursesController: CourseController) {
    this.controller = coursesController;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /my-courses:
     *   get:
     *     tags:
     *       - My Courses
     *     summary: Retrieve a list of courses
     *     description: Returns an array of course objects with optional filtering
     *     parameters:
     *       - in: query
     *         name: level
     *         schema:
     *           type: string
     *           enum: [beginner, intermediate, advanced]
     *         description: Filter by difficulty level
     *       - in: query
     *         name: uid
     *         schema:
     *           type: string
     *         description: Filter by user ID
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *         description: Filter by category
     *       - in: query
     *         name: language
     *         schema:
     *           type: string
     *         description: Filter by language
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *         description: Number of courses to return
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           minimum: 0
     *         description: Number of courses to skip
     *     responses:
     *       200:
     *         description: A list of courses
     *       500:
     *         description: Internal server error
     */
    this.router.get(
      '/my-courses',
      authMiddleware,
      this.controller.getCourses.bind(this.controller)
    );

    /**
     * @openapi
     * /my-courses/{id}:
     *   get:
     *     tags:
     *       - My Courses
     *     summary: Get a course by ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Course ID
     *     responses:
     *       200:
     *         description: Course found
     *       404:
     *         description: Course not found
     */
    this.router.get(
      '/my-courses/:id',
      authMiddleware,
      courseOwnershipMiddleware,
      this.controller.getCourseById.bind(this.controller)
    );

    /**
     * @openapi
     * /courses:
     *   post:
     *     tags:
     *       - My Courses
     *     summary: Generate a new course outline using AI
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - category
     *               - topic
     *               - level
     *               - duration
     *               - noOfChapters
     *               - language
     *             properties:
     *               category:
     *                 type: string
     *                 example: Programming
     *               topic:
     *                 type: string
     *                 example: TypeScript
     *               level:
     *                 type: string
     *                 enum: [beginner, intermediate, advanced]
     *                 example: intermediate
     *               duration:
     *                 type: string
     *                 example: 6 hours
     *               noOfChapters:
     *                 type: integer
     *                 minimum: 1
     *                 maximum: 20
     *                 example: 5
     *               language:
     *                 type: string
     *                 example: English
     *     responses:
     *       201:
     *         description: Course generated successfully
     *       400:
     *         description: Invalid request body
     */
    this.router.post(
      '/courses',
      authMiddleware,
      validateGenerateCourse,
      this.controller.generateCourse.bind(this.controller)
    );

    /**
     * @openapi
     * /courses/{id}:
     *   patch:
     *     tags:
     *       - My Courses
     *     summary: Update a course
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Course updated
     *       404:
     *         description: Course not found
     */
    // this.router.patch(
    //   '/courses/:id',
    //   validateCourseId,
    //   this.controller.updateCourse.bind(this.controller)
    // );

    /**
     * @openapi
     * /courses/{id}:
     *   delete:
     *     tags:
     *       - My Courses
     *     summary: Delete a course
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Course deleted
     *       404:
     *         description: Course not found
     */
    this.router.delete(
      '/courses/:id',
      authMiddleware,
      courseOwnershipMiddleware,
      validateCourseId,
      this.controller.deleteCourse.bind(this.controller)
    );

    // public route no need auth here

    /**
     * @openapi
     * /courses:
     *   get:
     *     tags:
     *       - Public Route Courses
     *     summary: Retrieve a list of courses
     *     description: Returns an array of course objects with optional filtering
     *     parameters:
     *       - in: query
     *         name: level
     *         schema:
     *           type: string
     *           enum: [beginner, intermediate, advanced]
     *         description: Filter by difficulty level
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *         description: Filter by category
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Filter by search term
     *       - in: query
     *         name: language
     *         schema:
     *           type: string
     *         description: Filter by language
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *         description: Number of courses to return
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           minimum: 0
     *         description: Number of courses to skip
     *     responses:
     *       200:
     *         description: A list of courses
     *       500:
     *         description: Internal server error
     */
    this.router.get(
      '/courses',
      this.controller.getCourses.bind(this.controller)
    );

    /**
     * @openapi
     * /courses/{id}:
     *   get:
     *     tags:
     *       - Public Route Courses
     *     summary: Get a course by ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Course ID
     *     responses:
     *       200:
     *         description: Course found
     *       404:
     *         description: Course not found
     */
    this.router.get(
      '/courses/:id',
      validateCourseId,
      this.controller.getCourseById.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
