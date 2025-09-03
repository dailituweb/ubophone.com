const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class WebSocketManager {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socket IDs
    this.socketUsers = new Map(); // socket ID -> userId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('✅ WebSocket server initialized');
    return this.io;
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user.id;
        socket.userEmail = user.email;
        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error.message);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      this.setupSocketHandlers(socket);
    });
  }

  handleConnection(socket) {
    const userId = socket.userId;
    
    console.log(`📱 User connected: ${socket.userEmail} (${userId})`);
    
    // Track user sockets
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socket.id);
    this.socketUsers.set(socket.id, userId);

    // Join user to their personal room
    socket.join(`user_${userId}`);
    
    // Send connection confirmation
    socket.emit('connected', {
      message: 'WebSocket connected successfully',
      userId: userId,
      timestamp: new Date().toISOString()
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });
  }

  handleDisconnection(socket, reason) {
    const userId = socket.userId;
    
    console.log(`📱 User disconnected: ${socket.userEmail} (${userId}) - Reason: ${reason}`);
    
    // Clean up tracking
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(socket.id);
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.socketUsers.delete(socket.id);
  }

  setupSocketHandlers(socket) {
    // Incoming call response handlers
    socket.on('incoming_call_response', (data) => {
      this.handleIncomingCallResponse(socket, data);
    });

    // Call status updates
    socket.on('call_status_update', (data) => {
      this.handleCallStatusUpdate(socket, data);
    });

    // Heartbeat/ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`❌ Socket error for user ${socket.userEmail}:`, error);
    });
  }

  async handleIncomingCallResponse(socket, data) {
    console.log(`📞 Incoming call response from ${socket.userEmail}:`, data);
    
    const { callSid, action, callId } = data;
    
    try {
      // 🔧 Simplified: Just handle WebSocket notification
      // The actual call processing is handled by /api/twilio/accept-incoming-call
      console.log(`📞 WebSocket notification: ${action} for ${callSid}`);
      
      // Notify other connected sessions about the call response
      if (action === 'accept') {
        this.io.to(`user_${socket.userId}`).emit('incomingCallAccepted', {
          callSid,
          callId,
          action,
          timestamp: new Date().toISOString()
        });
      } else if (action === 'decline') {
        this.io.to(`user_${socket.userId}`).emit('incomingCallDeclined', {
          callSid,
          callId,
          action,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ WebSocket notification sent: ${action} for ${callSid}`);
      
      // Notify the user about successful processing
      socket.emit('call_response_processed', {
        callSid,
        action,
        success: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`❌ Error processing call response for ${callSid}:`, error.message);
      
      // Notify the user about the error
      socket.emit('call_response_error', {
        callSid,
        action,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Also emit to other systems for logging/monitoring
    socket.broadcast.emit('call_response_received', {
      userId: socket.userId,
      callSid,
      callId,
      action,
      timestamp: new Date().toISOString()
    });
  }

  handleCallStatusUpdate(socket, data) {
    console.log(`📞 Call status update from ${socket.userEmail}:`, data);
    
    // Broadcast to all user's devices
    this.notifyUser(socket.userId, 'call_status_updated', data);
  }

  // Public methods for external use

  /**
   * Notify user about incoming call
   */
  notifyIncomingCall(userId, callData) {
    console.log(`🔔 Notifying user ${userId} about incoming call from ${callData.fromNumber}`);
    
    this.notifyUser(userId, 'incoming_call', {
      ...callData,
      timestamp: new Date().toISOString(),
      timeout: 30000 // 30 seconds to respond
    });
    
    return this.isUserOnline(userId);
  }

  /**
   * Notify user about call status change
   */
  notifyCallStatus(userId, statusData) {
    console.log(`📞 Notifying user ${userId} about call status: ${statusData.status}`);
    
    this.notifyUser(userId, 'call_status_change', {
      ...statusData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify user that incoming call has ended (caller hung up)
   */
  notifyIncomingCallEnded(userId, callEndData) {
    console.log(`📞 Notifying user ${userId} that incoming call ended: ${callEndData.status} for call ${callEndData.callSid}`);
    
    this.notifyUser(userId, 'incoming_call_ended', {
      ...callEndData,
      timestamp: new Date().toISOString()
    });
    
    return this.isUserOnline(userId);
  }

  /**
   * Notify user about new voicemail
   */
  notifyVoicemail(userId, voicemailData) {
    console.log(`📧 Notifying user ${userId} about new voicemail`);
    
    this.notifyUser(userId, 'new_voicemail', {
      ...voicemailData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify user about new call history record
   */
  notifyNewCallRecord(userId, callData) {
    console.log(`📞 Notifying user ${userId} about new call record`);
    
    this.notifyUser(userId, 'new_call_record', {
      ...callData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify user about dashboard data update
   */
  notifyDashboardUpdate(userId, dashboardData) {
    console.log(`📊 Notifying user ${userId} about dashboard update`);
    
    this.notifyUser(userId, 'dashboard_update', {
      ...dashboardData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send notification to all user's connected devices
   */
  notifyUser(userId, event, data) {
    if (this.io && this.isUserOnline(userId)) {
      this.io.to(`user_${userId}`).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Check if user is currently online
   */
  isUserOnline(userId) {
    return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount() {
    return this.userSockets.size;
  }

  /**
   * Get all connected sockets for a user
   */
  getUserSockets(userId) {
    return this.userSockets.get(userId) || new Set();
  }

  /**
   * Broadcast to all connected users
   */
  broadcastToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Get server stats
   */
  getStats() {
    return {
      connectedUsers: this.userSockets.size,
      totalSockets: this.socketUsers.size,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const webSocketManager = new WebSocketManager();

module.exports = webSocketManager;