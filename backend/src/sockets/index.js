import jwt from 'jsonwebtoken';

export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try { socket.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
    catch { next(new Error('Invalid or expired token')); }
  });

  io.on('connection', (socket) => {
    socket.on('reconnect_game', ({ gameId } = {}) => {
      if (typeof gameId !== 'string' || !gameId) return socket.emit('session_error', { message:'Invalid game ID' });
      // TODO: Verify participant/host membership from MongoDB before joining a room.
      socket.emit('session_error', { message:'Game reconnection is not implemented in this starter scaffold yet.' });
    });
  });
}
