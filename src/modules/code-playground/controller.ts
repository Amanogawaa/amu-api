import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import type { CodePlaygroundService } from "./service";
import type { ExecutionRequest, SaveWorkspaceRequest } from "./types";

export class CodePlaygroundController {
  private codePlaygroundService: CodePlaygroundService;
  constructor(codePlaygroundService: CodePlaygroundService) {
    this.codePlaygroundService = codePlaygroundService;
  }

  generateGuideline = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { lessonId } = req.params;

      if (!lessonId) {
        res.status(400).json({ message: "Lesson ID is required" });
        return;
      }

      const guideline =
        await this.codePlaygroundService.generateGuideline(lessonId);

      res.status(200).json({
        success: true,
        data: guideline,
        message: "Exercise guideline generated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getGuidelineByLesson = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { lessonId } = req.params;

      if (!lessonId) {
        res.status(400).json({ message: "Lesson ID is required" });
        return;
      }

      const guideline =
        await this.codePlaygroundService.getGuidelineByLessonId(lessonId);

      if (!guideline) {
        res.status(404).json({ message: "Exercise guideline not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: guideline,
        message: "Exercise guideline retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getGuidelineById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: "Guideline ID is required" });
        return;
      }

      const guideline = await this.codePlaygroundService.getGuidelineById(id);

      res.status(200).json({
        success: true,
        data: guideline,
        message: "Exercise guideline retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getGuidelinesByCourse = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        res.status(400).json({ message: "Course ID is required" });
        return;
      }

      const guidelines =
        await this.codePlaygroundService.getGuidelinesByCourseId(courseId);

      res.status(200).json({
        success: true,
        data: guidelines,
        message: "Exercise guidelines retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
