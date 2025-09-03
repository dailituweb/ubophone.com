import { BaseService } from '../core/BaseService.js';

/**
 * 通话管理服务
 * 处理通话的创建、管理和状态跟踪
 */
export class CallManager extends BaseService {
  constructor() {
    super('CallManager');
    this.currentCall = null;
    this.callHistory = [];
    this.state = {
      isCallActive: false,
      callStatus: 'idle',
      callDuration: 0,
      isMuted: false,
      isOnHold: false
    };
    this.callTimer = null;
  }

  // 创建通话
  async createCall(device, phoneNumber, params = {}) {
    try {
      if (this.currentCall) {
        throw new Error('Another call is already in progress');
      }

      if (!device || !device.connect) {
        throw new Error('Invalid Twilio device');
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      if (!formattedNumber) {
        throw new Error('Invalid phone number');
      }

      // 创建通话参数 - 🔧 修复：使用正确的Twilio Voice SDK参数格式
      const callParams = {
        params: {
          To: formattedNumber,
          ...params
        }
      };

      // 发起通话
      const call = await device.connect(callParams);
      this.currentCall = call;

      // 设置通话监听器
      this.setupCallListeners(call);

      // 更新状态
      this.setState({
        isCallActive: true,
        callStatus: 'connecting'
      });

      // 记录通话历史
      this.addToHistory({
        id: this.generateCallId(),
        number: formattedNumber,
        direction: 'outbound',
        startTime: new Date(),
        status: 'connecting'
      });

      this.emit('callCreated', { call, number: formattedNumber });
      return { success: true, call };

    } catch (error) {
      this.handleError(error, { operation: 'createCall', phoneNumber });
      return { success: false, error: error.message };
    }
  }

  // 接受来电
  async acceptCall(call) {
    try {
      if (!call || !call.accept) {
        throw new Error('Invalid call object');
      }

      await call.accept();
      this.currentCall = call;
      
      // 设置通话监听器
      this.setupCallListeners(call);

      // 更新状态
      this.setState({
        isCallActive: true,
        callStatus: 'connected'
      });

      this.emit('callAccepted', { call });
      return { success: true };

    } catch (error) {
      this.handleError(error, { operation: 'acceptCall' });
      return { success: false, error: error.message };
    }
  }

  // 拒绝通话
  async rejectCall(call) {
    try {
      if (!call || !call.reject) {
        throw new Error('Invalid call object');
      }

      await call.reject();
      this.emit('callRejected', { call });
      return { success: true };

    } catch (error) {
      this.handleError(error, { operation: 'rejectCall' });
      return { success: false, error: error.message };
    }
  }

  // 挂断通话
  async hangupCall() {
    try {
      if (!this.currentCall) {
        return { success: true, message: 'No active call' };
      }

      await this.currentCall.disconnect();
      return { success: true };

    } catch (error) {
      this.handleError(error, { operation: 'hangupCall' });
      return { success: false, error: error.message };
    }
  }

  // 静音/取消静音
  toggleMute() {
    try {
      if (!this.currentCall) {
        throw new Error('No active call');
      }

      const isMuted = this.currentCall.isMuted();
      this.currentCall.mute(!isMuted);
      
      this.setState({ isMuted: !isMuted });
      this.emit('muteToggled', { isMuted: !isMuted });
      
      return { success: true, isMuted: !isMuted };

    } catch (error) {
      this.handleError(error, { operation: 'toggleMute' });
      return { success: false, error: error.message };
    }
  }

  // 保持/取消保持
  toggleHold() {
    try {
      if (!this.currentCall) {
        throw new Error('No active call');
      }

      // Twilio SDK可能不支持hold功能，这里提供基础实现
      const isOnHold = this.state.isOnHold;
      
      if (typeof this.currentCall.hold === 'function') {
        this.currentCall.hold(!isOnHold);
      } else {
        // 降级实现：使用静音模拟保持
        this.currentCall.mute(!isOnHold);
      }
      
      this.setState({ isOnHold: !isOnHold });
      this.emit('holdToggled', { isOnHold: !isOnHold });
      
      return { success: true, isOnHold: !isOnHold };

    } catch (error) {
      this.handleError(error, { operation: 'toggleHold' });
      return { success: false, error: error.message };
    }
  }

  // 发送DTMF音调
  sendDTMF(tone) {
    try {
      if (!this.currentCall) {
        throw new Error('No active call');
      }

      this.currentCall.sendDigits(tone);
      this.emit('dtmfSent', { tone });
      
      return { success: true };

    } catch (error) {
      this.handleError(error, { operation: 'sendDTMF', tone });
      return { success: false, error: error.message };
    }
  }

  // 设置通话监听器
  setupCallListeners(call) {
    // 通话接受
    call.on('accept', () => {
      this.setState({ callStatus: 'accepted' });
      this.emit('callAccepted', { call });
    });

    // 通话连接
    call.on('connect', () => {
      this.setState({ callStatus: 'connected' });
      this.startCallTimer();
      this.emit('callConnected', { call });
    });

    // 通话响铃
    call.on('ringing', () => {
      this.setState({ callStatus: 'ringing' });
      this.emit('callRinging', { call });
    });

    // 通话断开
    call.on('disconnect', (error) => {
      this.handleCallDisconnect(error);
    });

    // 通话取消
    call.on('cancel', () => {
      this.setState({ callStatus: 'cancelled' });
      this.emit('callCancelled', { call });
      this.resetCallState();
    });

    // 通话拒绝
    call.on('reject', () => {
      this.setState({ callStatus: 'rejected' });
      this.emit('callRejected', { call });
      this.resetCallState();
    });

    // 通话错误
    call.on('error', (error) => {
      this.handleError(error, { operation: 'call', callId: call.parameters?.CallSid });
      this.emit('callError', { call, error });
    });

    // 音频质量监控
    call.on('sample', (sample) => {
      this.emit('audioSample', { sample });
    });
  }

  // 处理通话断开
  handleCallDisconnect(error) {
    const disconnectReason = error ? error.message : 'Normal disconnect';
    
    this.setState({ callStatus: 'disconnected' });
    this.emit('callDisconnected', { 
      call: this.currentCall, 
      reason: disconnectReason,
      duration: this.state.callDuration
    });

    this.resetCallState();
  }

  // 重置通话状态
  resetCallState() {
    this.stopCallTimer();
    this.currentCall = null;
    
    this.setState({
      isCallActive: false,
      callStatus: 'idle',
      callDuration: 0,
      isMuted: false,
      isOnHold: false
    });
  }

  // 开始通话计时
  startCallTimer() {
    this.stopCallTimer(); // 确保没有重复的计时器
    
    const startTime = Date.now();
    this.callTimer = setInterval(() => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      this.setState({ callDuration: duration });
      this.emit('callDurationUpdate', { duration });
    }, 1000);
  }

  // 停止通话计时
  stopCallTimer() {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
  }

  // 格式化电话号码
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    // 移除所有非数字字符
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // 如果没有国家代码，假设是美国号码
    if (!phoneNumber.startsWith('+')) {
      if (cleaned.length === 10) {
        return `+1${cleaned}`;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+${cleaned}`;
      }
    }
    
    return phoneNumber.startsWith('+') ? phoneNumber : `+${cleaned}`;
  }

  // 生成通话ID
  generateCallId() {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 添加到通话历史
  addToHistory(callData) {
    this.callHistory.unshift(callData);
    
    // 只保留最近100个通话记录
    if (this.callHistory.length > 100) {
      this.callHistory = this.callHistory.slice(0, 100);
    }
    
    this.emit('historyUpdated', { history: this.callHistory });
  }

  // 获取通话状态
  getCallStatus() {
    if (!this.currentCall) {
      return { hasCall: false, status: 'idle' };
    }

    try {
      return {
        hasCall: true,
        status: this.currentCall.status(),
        direction: this.currentCall.direction,
        parameters: this.currentCall.parameters,
        duration: this.state.callDuration,
        isMuted: this.state.isMuted,
        isOnHold: this.state.isOnHold
      };
    } catch (error) {
      return { hasCall: true, status: 'unknown', error: error.message };
    }
  }

  // 获取通话历史
  getCallHistory() {
    return [...this.callHistory];
  }

  // 清理资源
  destroy() {
    this.stopCallTimer();
    if (this.currentCall) {
      this.currentCall.disconnect();
    }
    super.destroy();
  }
}

export default CallManager;
