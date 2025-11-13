import { Router } from 'express';
import type { QuizController } from './controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export class QuizRoute {
  public router: Router;
  private controller: QuizController;

  constructor(quizController: QuizController) {
    this.controller = quizController;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /quiz/generate:
     *   post:
     *     tags:
     *       - Quiz
     *     summary: Generate a quiz for a lesson
     *     description: Generate quiz questions based on previous lessons content
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - lessonId
     *               - lessonName
     *               - previousLessonsContent
     *             properties:
     *               lessonId:
     *                 type: string
     *               lessonName:
     *                 type: string
     *               previousLessonsContent:
     *                 type: string
     *               numberOfQuestions:
     *                 type: integer
     *                 default: 5
     *               difficulty:
     *                 type: string
     *                 enum: [easy, medium, hard]
     *                 default: medium
     *     responses:
     *       201:
     *         description: Quiz generated successfully
     *       400:
     *         description: Invalid request
     */
    this.router.post(
      '/generate',
      this.controller.generateQuiz.bind(this.controller)
    );

    /**
     * @openapi
     * /lessons/{lessonId}/quiz:
     *   get:
     *     tags:
     *       - Quiz
     *     summary: Get quiz for a lesson
     *     description: Returns quiz questions without correct answers
     *     parameters:
     *       - in: path
     *         name: lessonId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Quiz retrieved successfully
     *       404:
     *         description: Quiz not found
     */
    this.router.get(
      '/lessons/:lessonId/quiz',
      this.controller.getQuiz.bind(this.controller)
    );

    /**
     * @openapi
     * /quizzes/{quizId}/submit:
     *   post:
     *     tags:
     *       - Quiz
     *     summary: Submit quiz answers
     *     description: Submit answers and receive graded results
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: quizId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - answers
     *             properties:
     *               answers:
     *                 type: array
     *                 items:
     *                   type: object
     *                   required:
     *                     - questionId
     *                     - selectedAnswer
     *                   properties:
     *                     questionId:
     *                       type: string
     *                     selectedAnswer:
     *                       type: string
     *     responses:
     *       201:
     *         description: Quiz submitted successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Quiz not found
     */
    this.router.post(
      '/quizzes/:quizId/submit',
      authMiddleware,
      this.controller.submitQuiz.bind(this.controller)
    );

    /**
     * @openapi
     * /quizzes/{quizId}/attempts:
     *   get:
     *     tags:
     *       - Quiz
     *     summary: Get user's quiz attempts
     *     description: Returns all attempts for a specific quiz by the authenticated user
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: quizId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Attempts retrieved successfully
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      '/quizzes/:quizId/attempts',
      authMiddleware,
      this.controller.getUserAttempts.bind(this.controller)
    );

    /**
     * @openapi
     * /attempts/{attemptId}:
     *   get:
     *     tags:
     *       - Quiz
     *     summary: Get a specific quiz attempt
     *     description: Returns detailed results of a quiz attempt
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: attemptId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Attempt retrieved successfully
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Access denied
     *       404:
     *         description: Attempt not found
     */
    this.router.get(
      '/attempts/:attemptId',
      authMiddleware,
      this.controller.getAttemptById.bind(this.controller)
    );
  }
}
