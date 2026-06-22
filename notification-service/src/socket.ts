import { Server, Socket } from 'socket.io';
import * as http from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopment123';

export let io: Server;

export function initSocketServer(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for dev/testing; can be restricted in production
      methods: ['GET', 'POST'],
    },
  });

  // Authentication Middleware
  io.use((socket: Socket, next) => {
    // Try to get token from auth object or query params
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    const userIdFallback = socket.handshake.auth?.userId || socket.handshake.query?.userId;

    if (token) {
      try {
        // Strip Bearer prefix if present
        const cleanToken = typeof token === 'string' && token.startsWith('Bearer ') 
          ? token.slice(7) 
          : token;
        
        const decoded = jwt.verify(cleanToken as string, JWT_SECRET) as { userId: string; username?: string };
        socket.data.userId = decoded.userId;
        socket.data.username = decoded.username || 'Authenticated User';
        return next();
      } catch (err) {
        console.warn(`JWT verification failed: ${(err as Error).message}`);
        // Fall back to direct userId if token failed but fallback is allowed for debugging
      }
    }

    // Dev Fallback Mode: If no JWT token is present (or fails verification),
    // allow connecting directly via a userId query parameter for testing/integration.
    if (userIdFallback && typeof userIdFallback === 'string') {
      console.log(`[Dev Mode] Authenticating user via direct userId parameter: ${userIdFallback}`);
      socket.data.userId = userIdFallback;
      socket.data.username = `Dev User (${userIdFallback})`;
      return next();
    }

    return next(new Error('Authentication error: Token or userId is required.'));
  });

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    const username = socket.data.username;

    console.log(`⚡ User connected: ${username} (ID: ${userId}) on socket ${socket.id}`);

    // Join a user-specific room
    const userRoom = `user:${userId}`;
    await socket.join(userRoom);
    console.log(`🚪 Socket ${socket.id} joined room: ${userRoom}`);

    // Immediately deliver any offline/undelivered notifications
    try {
      const offlineNotifications = await prisma.notification.findMany({
        where: {
          userId: userId,
          delivered: false,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (offlineNotifications.length > 0) {
        console.log(`📦 Delivering ${offlineNotifications.length} offline notifications to User ${userId}`);
        
        // Emit notifications to the client
        socket.emit('offline-notifications', offlineNotifications);

        // Update notifications as delivered in the database
        await prisma.notification.updateMany({
          where: {
            id: {
              in: offlineNotifications.map((n) => n.id),
            },
          },
          data: {
            delivered: true,
          },
        });
      }
    } catch (error) {
      console.error(`❌ Error delivering offline notifications for User ${userId}:`, error);
    }

    // Broadcast standard presence event (optional feature)
    socket.broadcast.emit('user-online', { userId });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${username} (ID: ${userId}) from socket ${socket.id}`);
      socket.broadcast.emit('user-offline', { userId });
    });
  });

  return io;
}

/**
 * Checks if a user has active socket connections
 */
export function isUserOnline(userId: string): boolean {
  if (!io) return false;
  const userRoom = `user:${userId}`;
  const roomSockets = io.sockets.adapter.rooms.get(userRoom);
  return roomSockets !== undefined && roomSockets.size > 0;
}

/**
 * Sends a notification in real-time or stores it offline if user is offline.
 */
export async function sendNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: string;
}) {
  const online = isUserOnline(data.userId);
  
  // Save notification to SQLite database
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      delivered: online, // true if user is online, false if offline
    },
  });

  if (online) {
    console.log(`🔔 Sending real-time notification to User ${data.userId}: "${data.title}"`);
    io.to(`user:${data.userId}`).emit('notification', notification);
  } else {
    console.log(`💾 User ${data.userId} is offline. Stored notification for later: "${data.title}"`);
  }

  return notification;
}
