import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../utils/loggers";
import { config } from "../config/environment";
import { firebaseAuth } from "../config/firebase";

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token = req.headers.authorization?.replace("Bearer ", "").trim();

    if (!token) {
      token = req.cookies?.[config.cookie || "FIREBASE_COOKIE_JWT"];
    }

    if (!token) {
      throw new AppError("No authentication token provided", 401);
    }

    const decodedToken = await firebaseAuth.verifyIdToken(token);

    req.user = {
      ...decodedToken,
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    const status = error instanceof AppError ? error.statusCode : 401;
    res.status(status).json({
      error: (error as Error).message,
      status: "error",
    });
  }
};
