const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

let ioInstance = null;

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('_id name role hostel approved');

      if (!user || !user.approved) {
        return next(new Error('User unauthorized or pending approval'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    // Join personal user room by user ID
    socket.join(userId);
    console.log(`[Socket.io] User connected: ${socket.user.name} (${userId})`);

    socket.on('disconnect', () => {
      console.log(`[Socket.io] User disconnected: ${userId}`);
    });
  });

  ioInstance = io;
  return io;
};

const getIO = () => {
  return ioInstance;
};

// Emit an event to a specific user's private room
const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  const room = userId.toString();
  ioInstance.to(room).emit(event, payload);
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
};
