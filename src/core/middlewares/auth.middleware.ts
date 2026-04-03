import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { convexClient, api } from "../convex";
import { AppError, UnauthorizedError } from "../utils/errors";
import { logger } from "../utils/loggers";
import { config } from "../../config/environment";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
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
      token = req.signedCookies?.["auth_token"] || req.cookies?.["auth_token"];
    }

    if (!token) {
      throw new UnauthorizedError("No authentication token provided");
    }

    // Decode JWT token to get user ID
    let userId: string;
    try {
      const decoded = jwt.decode(token) as {
        userId?: string;
        sub?: string;
        [key: string]: unknown;
      };
      userId = decoded?.userId || decoded?.sub || "";

      if (!userId) {
        throw new Error("Invalid token format");
      }
    } catch {
      throw new UnauthorizedError("Invalid token");
    }

    // Fetch user from Convex
    const user = await convexClient.query((api as any).auth.getUserById, {
      id: userId,
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    req.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      program: user.program,
      year: user.year,
      school: user.school,
      photoURL: user.photoURL,
      isPrivate: user.isPrivate,
    };

    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    const status = error instanceof AppError ? error.statusCode : 401;
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    res.status(status).json({
      error: message,
      status: "error",
    });
  }
};
