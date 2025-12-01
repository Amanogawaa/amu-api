import { Router } from "express";
import type { EnrollmentController } from "./controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

export class EnrollmentRoute {
  public router: Router;
  private controller: EnrollmentController;

  constructor(enrollmentController: EnrollmentController) {
    this.controller = enrollmentController;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /courses/{courseId}/enroll:
     *   post:
     *     tags:
     *       - Enrollment
     *     summary: Enroll in a course
     *     description: Enroll the authenticated user in a published course
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: Course ID to enroll in
     *     responses:
     *       201:
     *         description: Successfully enrolled in course
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                     courseId:
     *                       type: string
     *                     userId:
     *                       type: string
     *                     enrolledAt:
     *                       type: string
     *                       format: date-time
     *                     status:
     *                       type: string
     *                       enum: [active, completed, dropped]
     *                 message:
     *                   type: string
     *       400:
     *         description: Cannot enroll in own course
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Course is not published or is in draft
     *       409:
     *         description: Already enrolled in this course
     */
    this.router.post(
      "/courses/:courseId/enroll",
      authMiddleware,
      this.controller.enrollInCourse.bind(this.controller),
    );

    /**
     * @openapi
     * /courses/{courseId}/unenroll:
     *   delete:
     *     tags:
     *       - Enrollment
     *     summary: Unenroll from a course
     *     description: Unenroll the authenticated user from a course
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: Course ID to unenroll from
     *     responses:
     *       200:
     *         description: Successfully unenrolled from course
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       400:
     *         description: Enrollment is not active
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Enrollment not found
     */
    this.router.delete(
      "/courses/:courseId/unenroll",
      authMiddleware,
      this.controller.unenrollFromCourse.bind(this.controller),
    );

    /**
     * @openapi
     * /courses/{courseId}/enrollment-status:
     *   get:
     *     tags:
     *       - Enrollment
     *     summary: Get enrollment status for a course
     *     description: Check if the authenticated user is enrolled in a specific course
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: Course ID to check enrollment status
     *     responses:
     *       200:
     *         description: Enrollment status retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     isEnrolled:
     *                       type: boolean
     *                     enrollment:
     *                       type: object
     *                       properties:
     *                         id:
     *                           type: string
     *                         courseId:
     *                           type: string
     *                         userId:
     *                           type: string
     *                         enrolledAt:
     *                           type: string
     *                           format: date-time
     *                         status:
     *                           type: string
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      "/courses/:courseId/enrollment-status",
      authMiddleware,
      this.controller.getEnrollmentStatus.bind(this.controller),
    );

    /**
     * @openapi
     * /enrollments:
     *   get:
     *     tags:
     *       - Enrollment
     *     summary: Get all enrollments for authenticated user
     *     description: Retrieve all course enrollments for the authenticated user
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [active, completed, dropped]
     *         description: Filter by enrollment status
     *       - in: query
     *         name: courseId
     *         schema:
     *           type: string
     *         description: Filter by course ID
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *         description: Number of enrollments to return
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           minimum: 0
     *         description: Number of enrollments to skip
     *     responses:
     *       200:
     *         description: Enrollments retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                       courseId:
     *                         type: string
     *                       userId:
     *                         type: string
     *                       enrolledAt:
     *                         type: string
     *                         format: date-time
     *                       status:
     *                         type: string
     *                 message:
     *                   type: string
     *                 total:
     *                   type: integer
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      "/enrollments",
      authMiddleware,
      this.controller.getUserEnrollments.bind(this.controller),
    );

    /**
     * @openapi
     * /courses/{courseId}/enrollment-count:
     *   get:
     *     tags:
     *       - Enrollment
     *     summary: Get enrollment count for a course
     *     description: Get the total number of active enrollments for a course (public endpoint)
     *     parameters:
     *       - in: path
     *         name: courseId
     *         required: true
     *         schema:
     *           type: string
     *         description: Course ID
     *     responses:
     *       200:
     *         description: Enrollment count retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     courseId:
     *                       type: string
     *                     count:
     *                       type: integer
     *                 message:
     *                   type: string
     */
    this.router.get(
      "/courses/:courseId/enrollment-count",
      this.controller.getCourseEnrollmentCount.bind(this.controller),
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
