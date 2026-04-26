import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../core/utils/errors";

export const validateCourseId = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const { courseId } = req.params;

  if (!courseId || typeof courseId !== "string" || courseId.trim() === "") {
    throw new AppError("Invalid course ID", 400);
  }

  next();
};

export const validateLimitParam = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const { limit } = req.query;

  if (limit) {
    const limitNum = Number(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      throw new AppError("Limit must be between 1 and 50", 400);
    }
    req.query.limit = String(limitNum);
  }

  next();
};
