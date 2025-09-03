import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.activeTimeouts = new Map(); // 跟踪活跃的setTimeout
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      console.log('🔄 WebSocket already connected');
      return;
    }

    if (!token) {
      console.error('❌ Cannot connect WebSocket: No token provided');
      return;
    }

    const serverUrl = process.env.REACT_APP_SERVER_URL || 
      (process.env.NODE_ENV === 'production' ? 'https://ubophone.com' : 'http://localhost:5001');
    
    console.log('🔄 Connecting to WebSocket server...', serverUrl);

    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Notify listeners about connection
      this.emit('connected', { timestamp: new Date().toISOString() });
    });

    this.socket.on('connected', (data) => {
      console.log('📱 WebSocket server confirmed connection:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      
      this.emit('disconnected', { reason, timestamp: new Date().toISOString() });

      // Auto-reconnect logic
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        console.log('🔌 Server disconnected the socket');
      } else {
        // Client disconnect, try to reconnect
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      this.isConnected = false;
      
      if (error.message.includes('Authentication error')) {
        toast.error('Session expired. Please login again.');
        this.emit('auth_error', error);
      } else {
        this.handleReconnection();
      }
    });

    // Incoming call notifications
    this.socket.on('incoming_call', (callData) => {
      console.log('📞 Incoming call notification:', callData);
      this.handleIncomingCall(callData);
    });

    // Incoming call canceled by caller
    this.socket.on('incoming_call_canceled', (cancelData) => {
      console.log('📞 Incoming call canceled by caller:', cancelData);
      this.handleIncomingCallCanceled(cancelData);
    });

    // Call status updates
    this.socket.on('call_status_change', (statusData) => {
      console.log('📞 Call status update:', statusData);
      this.emit('call_status_change', statusData);
    });

    // Incoming call accepted via WebSocket
    this.socket.on('incomingCallAccepted', ({ callSid, callId, action, timestamp }) => {
      console.log('📲 incomingCallAccepted', callSid, callId, action);
      // Emit to React components to handle UI updates
      this.emit('incoming_call_accepted', { callSid, callId, action, timestamp });
    });

    // Incoming call declined via WebSocket
    this.socket.on('incomingCallDeclined', ({ callSid, callId, action, timestamp }) => {
      console.log('📲 incomingCallDeclined', callSid, callId, action);
      // Emit to React components to handle UI updates
      this.emit('incoming_call_declined', { callSid, callId, action, timestamp });
    });

    // New voicemail notifications
    this.socket.on('new_voicemail', (voicemailData) => {
      console.log('📧 New voicemail notification:', voicemailData);
      this.handleNewVoicemail(voicemailData);
    });

    // Heartbeat
    this.socket.on('pong', (data) => {
      console.log('💓 Received pong:', data);
    });

    // 🔥 新增：来电阶段挂断事件监听
    this.socket.on('incoming_call_ended', (data) => {
      console.log('📞 Incoming call ended by remote party:', data);
      
      // 清理对应的timeout
      if (data.callSid && this.activeTimeouts.has(data.callSid)) {
        clearTimeout(this.activeTimeouts.get(data.callSid));
        this.activeTimeouts.delete(data.callSid);
        console.log('🧹 Cleared timeout for ended call:', data.callSid);
      }
      
      // 停止铃声
      this.stopRingtone();
      
      // 发送给监听器
      this.emit('incoming_call_ended', data);
    });

    // Generic error handling
    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      toast.error('Connection lost. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, delay);
  }

  handleIncomingCall(callData) {
    console.log('🔔 Processing incoming call:', callData);
    
    // Request notification permission if not granted
    this.requestNotificationPermission();
    
    // Show browser notification
    this.showBrowserNotification('Incoming Call', {
      body: `Call from ${callData.fromNumber}`,
      icon: '/logo192.png',
      tag: `incoming_call_${callData.callSid}`,
      requireInteraction: true,
      data: callData
    });

    // Play ringtone
    this.playRingtone();
    
    // Emit to listeners (React components)
    this.emit('incoming_call', callData);
    
    // Auto-timeout after 30 seconds - 跟踪timeout ID以便清理
    const timeoutId = setTimeout(() => {
      this.emit('incoming_call_timeout', callData);
      this.activeTimeouts.delete(callData.callSid); // 清理跟踪
    }, callData.timeout || 30000);
    
    // 保存timeout ID以便后续清理
    this.activeTimeouts.set(callData.callSid, timeoutId);
  }

  handleIncomingCallCanceled(cancelData) {
    console.log('📞 Processing incoming call cancellation:', cancelData);
    
    // 清理对应的timeout
    if (cancelData.callSid && this.activeTimeouts.has(cancelData.callSid)) {
      clearTimeout(this.activeTimeouts.get(cancelData.callSid));
      this.activeTimeouts.delete(cancelData.callSid);
      console.log('🧹 Cleared timeout for canceled call:', cancelData.callSid);
    }
    
    // Stop ringtone immediately
    this.stopRingtone();
    
    // Clear any incoming call notifications
    this.clearIncomingCallNotifications(cancelData.callSid);
    
    // Emit to listeners (React components) to clean up UI
    this.emit('incoming_call_canceled', cancelData);
    
    console.log('✅ Incoming call canceled processing complete');
  }

  clearIncomingCallNotifications(callSid) {
    try {
      // Close browser notifications for this call
      if ('Notification' in window) {
        // Note: Modern browsers don't allow direct notification closing by tag
        // But we can track and close them if we store references
        console.log('🔔 Clearing notifications for call:', callSid);
      }
      
      // Clear toast notifications
      toast.dismiss('incoming_call_audio');
      toast.dismiss('incoming_call_audio_fallback');
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  }

  handleNewVoicemail(voicemailData) {
    console.log('📧 Processing new voicemail:', voicemailData);
    
    // Show browser notification
    this.showBrowserNotification('New Voicemail', {
      body: `Voicemail from ${voicemailData.fromNumber}`,
      icon: '/logo192.png',
      tag: `voicemail_${voicemailData.callSid}`,
      data: voicemailData
    });

    // Show toast notification
    toast.info(`📧 New voicemail from ${voicemailData.fromNumber}`, {
      onClick: () => {
        // Navigate to voicemail/call history
        window.location.href = '/incoming-calls';
      }
    });
    
    // Emit to listeners
    this.emit('new_voicemail', voicemailData);
  }

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('❌ Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('❌ Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  showBrowserNotification(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.log('❌ Cannot show notification: permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        ...options,
        icon: options.icon || '/logo192.png',
        badge: '/logo192.png'
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        if (options.data) {
          this.emit('notification_clicked', options.data);
        }
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    } catch (error) {
      console.error('❌ Error showing notification:', error);
    }
  }

  playRingtone() {
    try {
      console.log('📞 Playing ringtone for incoming call');
      toast.info('📞 Incoming call!', {
        autoClose: false,
        toastId: 'incoming_call_audio'
      });
      
      // Use Web Audio API directly for better compatibility
      this.playWebAudioRingtone();
    } catch (error) {
      console.error('❌ Error setting up ringtone:', error);
      // Final fallback - just visual notification
      toast.info('📞 Incoming call (enable audio permissions for sound)', {
        autoClose: false,
        toastId: 'incoming_call_audio_fallback'
      });
    }
  }

  playWebAudioRingtone() {
    try {
      // Create a more pleasant ringtone using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const playTone = (frequency, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Create a gentle attack and decay
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
        
        return oscillator;
      };
      
      // Create ringtone pattern (rising tones)
      const ringtonePattern = () => {
        if (this.currentRingtone && this.currentRingtone.active) {
          // Play ascending tone sequence
          playTone(523, 0.3); // C5
          setTimeout(() => playTone(659, 0.3), 300); // E5
          setTimeout(() => playTone(784, 0.6), 600); // G5
          
          // Repeat pattern
          setTimeout(() => {
            if (this.currentRingtone && this.currentRingtone.active) {
              ringtonePattern();
            }
          }, 1500);
        }
      };
      
      // Store reference to stop later
      this.currentRingtone = { 
        active: true,
        stop: () => {
          if (this.currentRingtone) {
            this.currentRingtone.active = false;
            try {
              audioContext.close();
            } catch (e) {
              console.log('Audio context already closed');
            }
          }
          this.currentRingtone = null;
        }
      };
      
      // Start ringtone pattern
      ringtonePattern();
      
      console.log('✅ Web Audio ringtone started');
      
    } catch (error) {
      console.error('❌ Web Audio API failed:', error);
      // Final fallback - just visual notification
      toast.info('📞 Incoming call (enable audio permissions for sound)', {
        autoClose: false,
        toastId: 'incoming_call_audio_fallback'
      });
    }
  }

  stopRingtone() {
    if (this.currentRingtone) {
      // Handle Web Audio API ringtone
      if (typeof this.currentRingtone.stop === 'function') {
        this.currentRingtone.stop();
      } else if (typeof this.currentRingtone.pause === 'function') {
        // HTML5 audio fallback
        this.currentRingtone.pause();
        this.currentRingtone.currentTime = 0;
      }
      this.currentRingtone = null;
    }
    
    // Clear any ringtone toasts
    toast.dismiss('incoming_call_audio');
    toast.dismiss('incoming_call_audio_fallback');
  }

  // Call response methods
  acceptCall(callData) {
    console.log('✅ Accepting call:', callData.callSid);
    this.stopRingtone();
    
    if (this.socket && this.isConnected) {
      this.socket.emit('incoming_call_response', {
        callSid: callData.callSid,
        callId: callData.callId,
        action: 'accept'
      });
    }
    
    this.emit('call_accepted', callData);
  }

  declineCall(callData) {
    console.log('❌ Declining call:', callData.callSid);
    
    // 清理对应的timeout
    if (callData.callSid && this.activeTimeouts.has(callData.callSid)) {
      clearTimeout(this.activeTimeouts.get(callData.callSid));
      this.activeTimeouts.delete(callData.callSid);
      console.log('🧹 Cleared timeout for declined call:', callData.callSid);
    }
    
    this.stopRingtone();
    
    if (this.socket && this.isConnected) {
      this.socket.emit('incoming_call_response', {
        callSid: callData.callSid,
        callId: callData.callId,
        action: 'decline'
      });
    }
    
    this.emit('call_declined', callData);
  }

  ignoreCall(callData) {
    console.log('🔇 Ignoring call:', callData.callSid);
    
    // 清理对应的timeout
    if (callData.callSid && this.activeTimeouts.has(callData.callSid)) {
      clearTimeout(this.activeTimeouts.get(callData.callSid));
      this.activeTimeouts.delete(callData.callSid);
      console.log('🧹 Cleared timeout for ignored call:', callData.callSid);
    }
    
    this.stopRingtone();
    
    if (this.socket && this.isConnected) {
      this.socket.emit('incoming_call_response', {
        callSid: callData.callSid,
        callId: callData.callId,
        action: 'ignore'
      });
    }
    
    this.emit('call_ignored', callData);
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  ping() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }

  sendCallStatus(statusData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('call_status_update', statusData);
    }
  }

  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    
    if (this.socket) {
      this.socket.off('incoming_call_ended'); // 清理新增的监听器
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.stopRingtone();
    this.listeners.clear();
  }

  // Getters
  get connected() {
    return this.isConnected;
  }

  get connectionState() {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

// 开发环境下暴露到全局作用域，便于调试
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.webSocketService = webSocketService;
  console.log('🔧 Debug: webSocketService exposed to window.webSocketService');
}

export default webSocketService;