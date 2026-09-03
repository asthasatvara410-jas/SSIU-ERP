const { Server } = require('socket.io');

let io;

module.exports = {
  /**
   * Initialize the Socket.IO server and attach it to the Express HTTP server
   */
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: '*', // Allow all origins for dev; restrict in prod
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });

    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle custom client events or authentication here if needed
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    return io;
  },

  /**
   * Get the initialized Socket.IO instance
   */
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },

  /**
   * Helper method to broadcast a generic CRUD event
   * @param {string} entity - e.g., 'student', 'faculty'
   * @param {string} action - e.g., 'created', 'updated', 'deleted'
   * @param {object} data - the payload
   */
  broadcastCrudEvent: (entity, action, data) => {
    if (io) {
      const eventName = `${entity}:${action}`;
      io.emit(eventName, data);
      console.log(`[Socket] Broadcasted event: ${eventName}`);
    }
  }
};
