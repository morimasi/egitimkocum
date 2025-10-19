import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './auth';

export interface SocketUser {
  userId: string;
  socketId: string;
  email: string;
  role: string;
}

const connectedUsers = new Map<string, SocketUser>();

export const initializeSocket = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // Configure this properly in production
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    socket.data.user = decoded;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user.email} (${socket.id})`);

    // Store connected user
    connectedUsers.set(user.userId, {
      userId: user.userId,
      socketId: socket.id,
      email: user.email,
      role: user.role
    });

    // Broadcast user online status
    io.emit('user:online', { userId: user.userId });

    // Join user's personal room
    socket.join(`user:${user.userId}`);

    // Handle joining conversation rooms
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${user.email} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${user.email} left conversation ${conversationId}`);
    });

    // Handle new message
    socket.on('message:send', (data: { conversationId: string; message: any }) => {
      io.to(`conversation:${data.conversationId}`).emit('message:new', data.message);
      console.log(`New message in conversation ${data.conversationId}`);
    });

    // Handle typing indicator
    socket.on('message:typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:typing', {
        userId: user.userId,
        isTyping: data.isTyping
      });
    });

    // Handle message read receipt
    socket.on('message:read', (data: { conversationId: string; messageId: string }) => {
      io.to(`conversation:${data.conversationId}`).emit('message:read', {
        userId: user.userId,
        messageId: data.messageId
      });
    });

    // Handle new notification
    socket.on('notification:send', (data: { userId: string; notification: any }) => {
      io.to(`user:${data.userId}`).emit('notification:new', data.notification);
    });

    // Handle assignment updates
    socket.on('assignment:update', (data: { assignmentId: string; update: any }) => {
      // Broadcast to relevant users (student and coach)
      if (data.update.studentId) {
        io.to(`user:${data.update.studentId}`).emit('assignment:updated', data);
      }
      if (data.update.coachId) {
        io.to(`user:${data.update.coachId}`).emit('assignment:updated', data);
      }
    });

    // Handle video call signals
    socket.on('call:offer', (data: { to: string; offer: any }) => {
      io.to(`user:${data.to}`).emit('call:offer', {
        from: user.userId,
        offer: data.offer
      });
    });

    socket.on('call:answer', (data: { to: string; answer: any }) => {
      io.to(`user:${data.to}`).emit('call:answer', {
        from: user.userId,
        answer: data.answer
      });
    });

    socket.on('call:ice-candidate', (data: { to: string; candidate: any }) => {
      io.to(`user:${data.to}`).emit('call:ice-candidate', {
        from: user.userId,
        candidate: data.candidate
      });
    });

    socket.on('call:end', (data: { to: string }) => {
      io.to(`user:${data.to}`).emit('call:end', {
        from: user.userId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.email} (${socket.id})`);
      connectedUsers.delete(user.userId);
      
      // Broadcast user offline status
      io.emit('user:offline', { userId: user.userId });
    });
  });

  // Helper function to get online users
  io.on('request:online-users', (socket) => {
    const onlineUsers = Array.from(connectedUsers.values());
    socket.emit('response:online-users', onlineUsers);
  });

  return io;
};

export const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};
