import type { Socket } from 'socket.io';
import { logger } from '../utils/loggers';
import { firebaseAuth } from '../config/firebase';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    uid: string;
    email?: string;
  };
}

/**
 * Socket.IO middleware to authenticate users via Firebase token
 */
export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization;

    if (!token) {
      logger.warn(`Socket ${socket.id} attempted connection without token`);
      return next(new Error('Authentication error: No token provided'));
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '');

    // Verify Firebase token
    const decodedToken = await firebaseAuth.verifyIdToken(cleanToken);

    socket.userId = decodedToken.uid;
    socket.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    logger.info(
      `Socket ${socket.id} authenticated for user ${decodedToken.uid}`
    );
    next();
  } catch (error) {
    logger.error(`Socket authentication failed for ${socket.id}:`, error);
    next(new Error('Authentication error: Invalid token'));
  }
};
