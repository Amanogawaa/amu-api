import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { logger } from "../utils/loggers";
import { convexClient, api } from "../convex";
import type { Id } from "../../../convex/_generated/dataModel";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email?: string;
  };
}

/**
 * Socket.IO middleware to authenticate users via JWT token
 */
export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
) => {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization;

    if (!token) {
      logger.warn(`Socket ${socket.id} attempted connection without token`);
      return next(new Error("Authentication error: No token provided"));
    }

    const cleanToken = token.replace("Bearer ", "");

    const decodedToken = jwt.decode(cleanToken) as {
      userId?: string;
      sub?: string;
      [key: string]: unknown;
    };

    const userId = decodedToken?.userId || decodedToken?.sub;

    if (!userId) {
      logger.warn(
        `Socket ${socket.id} attempted connection with invalid token format`,
      );
      return next(new Error("Authentication error: Invalid token format"));
    }

    const user = await convexClient.query(api.auth.getUserById, {
      id: userId as Id<"users">,
    });

    if (!user) {
      logger.warn(
        `Socket ${socket.id} attempted connection with non-existent user`,
      );
      return next(new Error("Authentication error: User not found"));
    }

    socket.userId = user._id;
    socket.user = {
      id: user._id,
      email: user.email,
    };

    logger.info(`Socket ${socket.id} authenticated for user ${user._id}`);
    next();
  } catch (error) {
    logger.error(`Socket authentication failed for ${socket.id}:`, error);
    next(new Error("Authentication error: Invalid token"));
  }
};
