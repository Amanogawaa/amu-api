import type { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors";
import { logger } from "../utils/loggers";

interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    fields?: Record<string, string>;
    requestId?: string;
  };
  status: "error";
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Extract or generate request ID
  const requestId =
    (req.headers["x-request-id"] as string) || crypto.randomUUID();

  // Log error with context
  logger.error("Error occurred", {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: (err as AppError).statusCode || 500,
  });

  // Handle operational errors (AppError and subclasses)
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        message: err.message,
        code: err.code,
        requestId,
      },
      status: "error",
    };

    // Add validation fields if present
    if (err instanceof ValidationError && err.fields) {
      response.error.fields = err.fields;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unknown/programming errors
  logger.error("Unexpected error", {
    requestId,
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: {
      message: "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR",
      requestId,
    },
    status: "error",
  });
};
