import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { SUPPORTED_LANGUAGES } from './types';

export const validateExecuteCode = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { code, language, lessonId } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Code is required and must be a string',
    });
    return;
  }

  if (!language || typeof language !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Language is required and must be a string',
    });
    return;
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    res.status(400).json({
      success: false,
      message: `Unsupported language. Supported languages are: ${SUPPORTED_LANGUAGES.join(
        ', '
      )}`,
    });
    return;
  }

  // if (!lessonId || typeof lessonId !== 'string') {
  //   res.status(400).json({
  //     success: false,
  //     message: 'Lesson ID is required and must be a string',
  //   });
  //   return;
  // }

  // Code length validation (max 50KB)
  if (code.length > 50000) {
    res.status(400).json({
      success: false,
      message: 'Code exceeds maximum length of 50,000 characters',
    });
    return;
  }

  next();
};

export const validateSaveWorkspace = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { code, language, lessonId, courseId } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Code is required and must be a string',
    });
    return;
  }

  if (!language || typeof language !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Language is required and must be a string',
    });
    return;
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    res.status(400).json({
      success: false,
      message: `Unsupported language. Supported languages are: ${SUPPORTED_LANGUAGES.join(
        ', '
      )}`,
    });
    return;
  }

  if (!lessonId || typeof lessonId !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Lesson ID is required and must be a string',
    });
    return;
  }

  if (!courseId || typeof courseId !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Course ID is required and must be a string',
    });
    return;
  }

  // Code length validation (max 100KB for storage)
  if (code.length > 100000) {
    res.status(400).json({
      success: false,
      message: 'Code exceeds maximum length of 100,000 characters',
    });
    return;
  }

  next();
};
