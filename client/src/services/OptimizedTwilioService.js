import { BaseService } from './core/BaseService.js';
import AudioManager from './audio/AudioManager.js';
import TokenManager from './auth/TokenManager.js';
import CallManager from './call/CallManager.js';
import DeviceManager from './device/DeviceManager.js';

/**
 * 优化的Twilio服务
 * 整合所有子服务，提供统一的API接口
 */
class OptimizedTwilioService extends BaseService {
  constructor() {
    super('OptimizedTwilioService');
    
    // 初始化子服务
    this.audioManager = new AudioManager();
    this.tokenManager = new TokenManager();
    this.callManager = new CallManager();
    this.deviceManager = new DeviceManager();
    
    // 服务状态
    this.state = {
      initialized: false,
      ready: false,
      lastError: null
    };

    // 设置子服务间的通信
    this.setupServiceCommunication();
  }

  // 设置服务间通信
  setupServiceCommunication() {
    // Token刷新时重新初始化设备
    this.tokenManager.on('refreshSuccess', async ({ token }) => {
      if (this.deviceManager.isReady()) {
        await this.deviceManager.reinitialize(token);
      }
    });

    // 设备错误时尝试刷新Token
    this.deviceManager.on('error', async (errorData) => {
      if (errorData.type === 'token_expired') {
        await this.tokenManager.refreshToken();
      }
    });

    // 转发重要事件
    this.deviceManager.on('incomingCall', (data) => {
      this.emit('incoming', data);
    });

    this.callManager.on('callConnected', (data) => {
      this.emit('connected', data);
    });

    this.callManager.on('callDisconnected', (data) => {
      this.emit('disconnected', data);
    });

    // 音频权限变化
    this.audioManager.on('permissionChanged', (status) => {
      this.emit('permissionChanged', status);
    });
  }

  // 初始化服务
  async initialize(token) {
    try {
      if (!token || token.startsWith('demo_token_')) {
        console.warn('⚠️ Invalid Twilio token, using demo mode');
        return { success: false, error: 'Demo mode - real calling requires valid Twilio configuration.' };
      }

      // 1. 初始化音频管理器
      const audioResult = await this.audioManager.initialize();
      if (!audioResult.success) {
        console.warn('Audio manager initialization failed:', audioResult.error);
      }

      // 2. 设置Token
      this.tokenManager.setToken(token);
      
      // 3. 初始化设备
      const deviceResult = await this.deviceManager.initialize(token);
      if (!deviceResult.success) {
        throw new Error(`Device initialization failed: ${deviceResult.error}`);
      }

      // 4. 启动Token自动刷新
      this.tokenManager.startAutoRefresh();

      this.setState({
        initialized: true,
        ready: true,
        lastError: null
      });

      this.isInitialized = true;
      this.emit('initialized');

      return { success: true };

    } catch (error) {
      this.handleError(error, { operation: 'initialize' });
      return { success: false, error: error.message };
    }
  }

  // 发起通话
  async makeCall(phoneNumber, callerIdNumber = null) {
    try {
      this.ensureInitialized();

      // 检查Token有效性
      const tokenCheck = await this.tokenManager.ensureValidToken();
      if (!tokenCheck.success) {
        throw new Error(`Token validation failed: ${tokenCheck.error}`);
      }

      // 检查设备状态
      if (!this.deviceManager.isReady()) {
        throw new Error('Device not ready for calls');
      }

      // 检查音频权限
      const permissionCheck = await this.audioManager.checkPermissions();
      if (!permissionCheck.granted) {
        const permissionResult = await this.audioManager.requestPermission();
        if (!permissionResult.success) {
          throw new Error('Microphone permission required for calls');
        }
      }

      // 恢复音频上下文
      await this.audioManager.resumeAudioContext();

      // 创建通话参数
      const params = {};
      if (callerIdNumber) {
        params.From = callerIdNumber;
      }

      // 发起通话
      const device = this.deviceManager.getDevice();
      const result = await this.callManager.createCall(device, phoneNumber, params);
      
      if (result.success) {
        this.emit('connecting', { to: phoneNumber, call: result.call });
      }

      return result;

    } catch (error) {
      this.handleError(error, { operation: 'makeCall', phoneNumber });
      
      // 特殊处理Token过期错误
      if (error.code === 20104 || error.message?.includes('AccessTokenExpired')) {
        const refreshResult = await this.tokenManager.refreshToken();
        if (refreshResult.success) {
          return { success: false, error: 'Token refreshed, please try again', canRetry: true };
        }
      }

      return { success: false, error: error.message };
    }
  }

  // 接受通话
  async acceptCall() {
    try {
      const callStatus = this.callManager.getCallStatus();
      if (!callStatus.hasCall) {
        throw new Error('No incoming call to accept');
      }

      // 恢复音频上下文
      await this.audioManager.resumeAudioContext();

      // 接受通话
      return await this.callManager.acceptCall(this.callManager.currentCall);

    } catch (error) {
      this.handleError(error, { operation: 'acceptCall' });
      return { success: false, error: error.message };
    }
  }

  // 拒绝通话
  async rejectCall() {
    try {
      const callStatus = this.callManager.getCallStatus();
      if (!callStatus.hasCall) {
        return { success: true, message: 'No call to reject' };
      }

      return await this.callManager.rejectCall(this.callManager.currentCall);

    } catch (error) {
      this.handleError(error, { operation: 'rejectCall' });
      return { success: false, error: error.message };
    }
  }

  // 挂断通话
  async hangupCall() {
    try {
      return await this.callManager.hangupCall();
    } catch (error) {
      this.handleError(error, { operation: 'hangupCall' });
      return { success: false, error: error.message };
    }
  }

  // 静音切换
  toggleMute() {
    return this.callManager.toggleMute();
  }

  // 保持切换
  toggleHold() {
    return this.callManager.toggleHold();
  }

  // 发送DTMF
  sendDTMF(tone) {
    return this.callManager.sendDTMF(tone);
  }

  // 设置通话状态回调
  setCallStatusCallback(callback) {
    this.onCallStatusChange = callback;
    
    // 转发所有通话相关事件
    const events = ['connecting', 'ringing', 'connected', 'disconnected', 'error'];
    events.forEach(event => {
      this.on(event, (data) => {
        if (callback) {
          callback(event, data);
        }
      });
    });
  }

  // 获取设备状态
  getDeviceStatus() {
    return {
      audio: this.audioManager.getStatus(),
      token: this.tokenManager.getStatus(),
      device: this.deviceManager.getDeviceStatus(),
      call: this.callManager.getCallStatus(),
      service: this.getState()
    };
  }

  // 获取音频设备
  async getAudioInputDevices() {
    return this.audioManager.getInputDevices();
  }

  async getAudioOutputDevices() {
    return this.audioManager.getOutputDevices();
  }

  // 设置音频设备
  async setAudioInputDevice(deviceId) {
    return this.audioManager.setInputDevice(deviceId);
  }

  async setAudioOutputDevice(deviceId) {
    return this.audioManager.setOutputDevice(deviceId);
  }

  // 检查麦克风权限
  async checkMicrophonePermission() {
    return this.audioManager.checkPermissions();
  }

  // 请求麦克风权限
  async requestMicrophonePermission() {
    return this.audioManager.requestPermission();
  }

  // 模拟演示通话
  simulateDemoCall(phoneNumber) {
    console.log('🎭 Starting demo call simulation to:', phoneNumber);
    
    const events = [
      { event: 'connecting', delay: 500 },
      { event: 'ringing', delay: 2000 },
      { event: 'connected', delay: 4000 },
      { event: 'disconnected', delay: 10000 }
    ];

    events.forEach(({ event, delay }) => {
      setTimeout(() => {
        if (this.onCallStatusChange) {
          this.onCallStatusChange(event, { number: phoneNumber });
        }
        this.emit(event, { number: phoneNumber });
      }, delay);
    });

    return { success: true, demo: true };
  }

  // 销毁服务
  async destroy() {
    try {
      // 停止Token自动刷新
      this.tokenManager.stopAutoRefresh();

      // 销毁所有子服务
      await this.deviceManager.destroy();
      await this.callManager.destroy();
      await this.audioManager.destroy();
      await this.tokenManager.destroy();

      this.setState({
        initialized: false,
        ready: false
      });

      this.isInitialized = false;

    } catch (error) {
      this.handleError(error, { operation: 'destroy' });
    }

    super.destroy();
  }
}

// 创建单例实例
const optimizedTwilioService = new OptimizedTwilioService();

export default optimizedTwilioService;
