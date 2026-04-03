import type { Request, Response } from "express";
import { Router } from "express";
import { getSocketHandlers } from "../../utils/socket/socket.helpers";

const router = Router();

/**
 * Test endpoint to broadcast a message to all connected clients
 * GET /api/socket/test/broadcast?message=Hello
 */
router.get("/test/broadcast", (req: Request, res: Response) => {
  const socketHandlers = getSocketHandlers(req);
  const message = (req.query.message as string) || "Test broadcast message";

  if (!socketHandlers) {
    return res.status(500).json({
      success: false,
      error: "Socket handlers not initialized",
    });
  }

  socketHandlers.broadcast("notification", {
    type: "info",
    message: message,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: "Broadcast sent",
    data: { message },
  });
});

/**
 * Test endpoint to send message to a specific user
 * GET /api/socket/test/user/:userId?message=Hello
 */
router.get("/test/user/:userId", (req: Request, res: Response) => {
  const socketHandlers = getSocketHandlers(req);
  const userId = req.params.userId as string;
  const message = (req.query.message as string) || "Test user message";

  if (!socketHandlers) {
    return res.status(500).json({
      success: false,
      error: "Socket handlers not initialized",
    });
  }

  socketHandlers.emitToUser(userId, "notification", {
    type: "info",
    message: message,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Message sent to user ${userId}`,
    data: { userId, message },
  });
});

/**
 * Test endpoint to send message to a course room
 * GET /api/socket/test/course/:courseId?message=Hello
 */
router.get("/test/course/:courseId", (req: Request, res: Response) => {
  const socketHandlers = getSocketHandlers(req);
  const courseId = req.params.courseId as string;
  const message = (req.query.message as string) || "Test course message";

  if (!socketHandlers) {
    return res.status(500).json({
      success: false,
      error: "Socket handlers not initialized",
    });
  }

  socketHandlers.emitToCourse(courseId, "notification", {
    type: "info",
    message: message,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Message sent to course ${courseId}`,
    data: { courseId, message },
  });
});

/**
 * Get Socket.IO server stats
 * GET /api/socket/stats
 */
router.get("/stats", (req: Request, res: Response) => {
  const socketHandlers = getSocketHandlers(req);

  if (!socketHandlers) {
    return res.status(500).json({
      success: false,
      error: "Socket handlers not initialized",
    });
  }

  const sockets = socketHandlers.io.sockets.sockets;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connectedClients = Array.from(sockets.values()).map((socket: any) => ({
    id: socket.id,
    userId: socket.userId,
    rooms: Array.from(socket.rooms),
  }));

  res.json({
    success: true,
    data: {
      totalConnections: sockets.size,
      clients: connectedClients,
    },
  });
});

export default router;
