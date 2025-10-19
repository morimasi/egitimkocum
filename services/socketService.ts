import { io, Socket } from 'socket.io-client';
import { getToken } from './authService';

class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

  // Connect to socket server
  connect() {
    const token = getToken();
    
    if (!token) {
      console.error('No auth token found');
      return;
    }

    this.socket = io(this.serverUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Join a conversation room
  joinConversation(conversationId: string) {
    this.socket?.emit('conversation:join', conversationId);
  }

  // Leave a conversation room
  leaveConversation(conversationId: string) {
    this.socket?.emit('conversation:leave', conversationId);
  }

  // Send a message
  sendMessage(conversationId: string, message: any) {
    this.socket?.emit('message:send', { conversationId, message });
  }

  // Send typing indicator
  sendTyping(conversationId: string, isTyping: boolean) {
    this.socket?.emit('message:typing', { conversationId, isTyping });
  }

  // Send read receipt
  sendReadReceipt(conversationId: string, messageId: string) {
    this.socket?.emit('message:read', { conversationId, messageId });
  }

  // Send notification
  sendNotification(userId: string, notification: any) {
    this.socket?.emit('notification:send', { userId, notification });
  }

  // Update assignment
  updateAssignment(assignmentId: string, update: any) {
    this.socket?.emit('assignment:update', { assignmentId, update });
  }

  // Video call signaling
  sendCallOffer(to: string, offer: any) {
    this.socket?.emit('call:offer', { to, offer });
  }

  sendCallAnswer(to: string, answer: any) {
    this.socket?.emit('call:answer', { to, answer });
  }

  sendIceCandidate(to: string, candidate: any) {
    this.socket?.emit('call:ice-candidate', { to, candidate });
  }

  endCall(to: string) {
    this.socket?.emit('call:end', { to });
  }

  // Event listeners
  onUserOnline(callback: (data: { userId: string }) => void) {
    this.socket?.on('user:online', callback);
  }

  onUserOffline(callback: (data: { userId: string }) => void) {
    this.socket?.on('user:offline', callback);
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('message:new', callback);
  }

  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.on('message:typing', callback);
  }

  onMessageRead(callback: (data: { userId: string; messageId: string }) => void) {
    this.socket?.on('message:read', callback);
  }

  onNewNotification(callback: (notification: any) => void) {
    this.socket?.on('notification:new', callback);
  }

  onAssignmentUpdated(callback: (data: any) => void) {
    this.socket?.on('assignment:updated', callback);
  }

  onCallOffer(callback: (data: { from: string; offer: any }) => void) {
    this.socket?.on('call:offer', callback);
  }

  onCallAnswer(callback: (data: { from: string; answer: any }) => void) {
    this.socket?.on('call:answer', callback);
  }

  onIceCandidate(callback: (data: { from: string; candidate: any }) => void) {
    this.socket?.on('call:ice-candidate', callback);
  }

  onCallEnd(callback: (data: { from: string }) => void) {
    this.socket?.on('call:end', callback);
  }

  // Remove all listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export default new SocketService();
