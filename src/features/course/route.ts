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
     *               - noOfModules
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
     *               noOfModules:
     *                 type: integer
     *                 minimum: 1
     *                 maximum: 20
     *                 example: 5
     *               language:
     *                 type: string
     *                 example: English
     *               userInstructions:
     *                 type: string
     *                 example: Emphasize real-world projects
     *                 description: Optional guidance fed directly to the model
     *               promptMode:
     *                 type: string
     *                 enum: [system, legacy]
     *                 example: system
     *                 description: Use legacy to benchmark the previous prompt format
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
     * /courses/generate-full:
     *   post:
     *     tags:
     *       - My Courses
     *     summary: Generate a complete course with modules, chapters, and lessons using AI
     *     description: |
     *       Generates a full course structure including all nested components.
     *       This is an asynchronous operation that returns immediately with a 202 status.
     *       Connect to Socket.IO and listen for 'generation:progress' events to track progress.
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
     *               - noOfModules
     *               - language
     *             properties:
     *               category:
     *                 type: string
     *                 example: Programming
     *                 description: Course category
     *               topic:
     *                 type: string
     *                 example: Full Stack Web Development
     *                 description: Main topic of the course
     *               level:
     *                 type: string
     *                 enum: [beginner, intermediate, advanced]
     *                 example: intermediate
     *                 description: Difficulty level
     *               duration:
     *                 type: string
     *                 example: 40 hours
     *                 description: Total course duration
     *               noOfModules:
     *                 type: integer
     *                 minimum: 1
     *                 maximum: 10
     *                 example: 5
     *                 description: Number of modules to generate
     *               language:
     *                 type: string
     *                 example: English
     *                 description: Course language
     *               userInstructions:
     *                 type: string
     *                 example: Focus on practical projects
     *                 description: Optional custom instructions for AI
     *               promptMode:
     *                 type: string
     *                 enum: [system, legacy]
     *                 example: system
     *                 description: Switch to legacy to compare prompt performance
     *     responses:
     *       202:
     *         description: Generation started, listen to Socket.IO for progress
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Course generation started
     *                 note:
     *                   type: string
     *                   example: Connect to Socket.IO and listen for generation:progress events
     *       400:
     *         description: Invalid request body
     *       503:
     *         description: Service not available
     */
    this.router.post(
      '/courses/generate-full',
      authMiddleware,
      validateGenerateCourse,
      this.controller.generateFullCourse.bind(this.controller)
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
     *         name: archive
     *         schema:
     *           type: boolean
     *         description: Filter by archive status
     *       - in: query
     *         name: publish
     *         schema:
     *           type: boolean
     *         description: Filter by publish status
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

    /**
     * @openapi
     * /courses/{id}/validate:
     *   get:
     *     tags:
     *       - My Courses
     *     summary: Validate course completeness before publishing
     *     description: Check if course has all required components (modules, chapters, lessons)
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Course ID
     *     responses:
     *       200:
     *         description: Validation result
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     isComplete:
     *                       type: boolean
     *                     missingComponents:
     *                       type: array
     *                       items:
     *                         type: string
     *                     details:
     *                       type: object
     *                       properties:
     *                         hasModules:
     *                           type: boolean
     *                         modulesCount:
     *                           type: integer
     *                         hasChapters:
     *                           type: boolean
     *                         chaptersCount:
     *                           type: integer
     *                         hasLessons:
     *                           type: boolean
     *                         lessonsCount:
     *                           type: integer
     *       400:
     *         description: Invalid course ID
     *       404:
     *         description: Course not found
     */
    this.router.get(
      '/courses/:id/validate',
      authMiddleware,
      validateCourseId,
      courseOwnershipMiddleware,
      this.controller.validateCourseCompleteness.bind(this.controller)
    );

    /**
     * @openapi
     * /courses/{id}/publish:
     *   patch:
     *     tags:
     *       - My Courses
     *     summary: Publish a course
     *     description: Publish a course after validating it has all required components
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Course ID
     *     responses:
     *       200:
     *         description: Course published successfully
     *       400:
     *         description: Course is incomplete or invalid
     *       404:
     *         description: Course not found
     */
    this.router.patch(
      '/courses/:id/publish',
      authMiddleware,
      validateCourseId,
      courseOwnershipMiddleware,
      this.controller.publishCourse.bind(this.controller)
    );

    /**
     * @openapi
     * /courses/{id}/unpublish:
     *   patch:
     *     tags:
     *       - My Courses
     *     summary: Unpublish a course
     *     description: Set course publish status to false
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Course ID
     *     responses:
     *       200:
     *         description: Course unpublished successfully
     *       404:
     *         description: Course not found
     */
    this.router.patch(
      '/courses/:id/unpublish',
      authMiddleware,
      validateCourseId,
      courseOwnershipMiddleware,
      this.controller.unpublishCourse.bind(this.controller)
    );

    /**
     * @openapi
     * /courses/{id}/archive:
     *   patch:
     *     tags:
     *       - My Courses
     *     summary: Archive a course
     *     description: Archive a course (makes it private and unpublished)
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Course ID
     *     responses:
     *       200:
     *         description: Course archived successfully
     *       404:
     *         description: Course not found
     */
    this.router.patch(
      '/courses/:id/archive',
      authMiddleware,
      validateCourseId,
      courseOwnershipMiddleware,
      this.controller.archiveCourse.bind(this.controller)
    );

    /**
     * @openapi
     * /courses/{id}/unarchive:
     *   patch:
     *     tags:
     *       - My Courses
     *     summary: Unarchive a course
     *     description: Remove archive status from a course
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Course ID
     *     responses:
     *       200:
     *         description: Course unarchived successfully
     *       404:
     *         description: Course not found
     */
    this.router.patch(
      '/courses/:id/unarchive',
      authMiddleware,
      validateCourseId,
      courseOwnershipMiddleware,
      this.controller.unarchiveCourse.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
