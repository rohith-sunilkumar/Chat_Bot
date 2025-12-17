import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

const userSocketMap = new Map(); // userId -> socketId

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`✅ User connected: ${socket.user.username} (${socket.userId})`);

    // Store socket connection in memory
    userSocketMap.set(socket.userId, socket.id);
    socket.join(socket.userId);

    // Update user online status (non-blocking, fire and forget)
    User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
    }).catch(err => console.error('Error updating user status:', err));

    // Broadcast online status to all users
    socket.broadcast.emit('userOnline', {
      userId: socket.userId,
      isOnline: true,
    });

    // Join user's conversation rooms
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.user.username} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.user.username} left conversation ${conversationId}`);
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit('userTyping', {
        userId: socket.userId,
        username: socket.user.username,
        conversationId,
        isTyping,
      });
    });

    // Handle new message (real-time)
    socket.on('sendMessage', (message) => {
      socket.to(message.conversation).emit('newMessage', message);
    });

    // Message read receipt
    socket.on('messageRead', ({ messageId, conversationId }) => {
      socket.to(conversationId).emit('messageRead', {
        messageId,
        userId: socket.userId,
      });
    });

    // Message delivered receipt
    socket.on('messageDelivered', ({ messageId, conversationId }) => {
      socket.to(conversationId).emit('messageDelivered', {
        messageId,
        userId: socket.userId,
      });
    });

    // Video/voice call signaling
    socket.on('callUser', ({ to, offer, callType }) => {
      io.to(to).emit('incomingCall', {
        from: socket.userId,
        offer,
        callType,
        caller: {
          username: socket.user.username,
          avatar: socket.user.avatar,
        },
      });
    });

    socket.on('answerCall', ({ to, answer }) => {
      io.to(to).emit('callAnswered', {
        from: socket.userId,
        answer,
      });
    });

    socket.on('rejectCall', ({ to }) => {
      io.to(to).emit('callRejected', {
        from: socket.userId,
      });
    });

    socket.on('endCall', ({ to }) => {
      io.to(to).emit('callEnded', {
        from: socket.userId,
      });
    });

    // ICE candidates for WebRTC
    socket.on('iceCandidate', ({ to, candidate }) => {
      io.to(to).emit('iceCandidate', {
        from: socket.userId,
        candidate,
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.user.username} (${socket.userId})`);

      // Remove from socket map
      userSocketMap.delete(socket.userId);

      // Update user offline status (non-blocking)
      User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      }).catch(err => console.error('Error updating user status:', err));

      // Broadcast offline status
      socket.broadcast.emit('userOffline', {
        userId: socket.userId,
        isOnline: false,
        lastSeen: new Date(),
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });
};

export const getSocketId = (userId) => {
  return userSocketMap.get(userId);
};
