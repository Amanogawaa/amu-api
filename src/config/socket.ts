import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { logger } from '../utils/loggers';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../utils/socket/socket.types';

export interface SocketConfig {
  cors: {
    origin: string[];
    methods: string[];
    credentials: boolean;
  };
  pingTimeout: number;
  pingInterval: number;
}

export const socketConfig: SocketConfig = {
  cors: {
    origin: [process.env.NEXTJS_FRONTEND_URL || 'http://localhost:3000', '*'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
};

export function initializeSocketIO(
  httpServer: HTTPServer
): SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData> {
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    {},
    SocketData
  >(httpServer, socketConfig);

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  return io;
}
