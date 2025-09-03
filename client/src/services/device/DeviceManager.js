import { BaseService } from '../core/BaseService.js';
import { Device } from '@twilio/voice-sdk';

/**
 * 设备管理服务
 * 处理Twilio设备的初始化、注册和管理
 */
export class DeviceManager extends BaseService {
  constructor() {
    super('DeviceManager');
    this.device = null;
    this.registrationAttempts = 0;
    this.maxRegistrationAttempts = 3;
    this.state = {
      deviceState: 'uninitialized',
      isRegistered: false,
      isReady: false,
      lastError: null
    };
  }

  // 初始化设备
  async initialize(token, options = {}) {
    try {
      if (this.device) {
        await this.destroy();
      }

      // 默认配置
      const defaultOptions = {
        codecPreferences: ['opus', 'pcmu'],
        enableDscp: false,
        debug: false,
        allowIncomingWhileBusy: false,
        maxAverageBitrate: 10000,
        closeProtection: false,
        enableImprovedSignalingErrorPrecision: true,
        rtcConfiguration: {
          iceServers: [
            { urls: 'stun:global.stun.twilio.com:3478' }
          ],
          iceCandidatePoolSize: 2,
          iceTransportPolicy: 'all',
          bundlePolicy: 'balanced'
        },
        connectionTimeout: 10000,
        enableRingingState: true
      };

      const config = { ...defaultOptions, ...options };

      // 创建设备
      this.device = new Device(token, config);
      
      // 设置事件监听器
      this.setupDeviceListeners();

      // 等待设备注册
      await this.waitForRegistration();

      this.setState({
        deviceState: this.device.state,
        isRegistered: this.device.state === 'registered',
        isReady: true
      });

      this.isInitialized = true;
      this.emit('initialized', { device: this.device });

      return { success: true, device: this.device };

    } catch (error) {
      this.handleError(error, { operation: 'initialize' });
      return { success: false, error: error.message };
    }
  }

  // 等待设备注册
  async waitForRegistration() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Device registration timeout'));
      }, 30000); // 30秒超时

      if (this.device.state === 'registered') {
        clearTimeout(timeout);
        resolve();
        return;
      }

      const onRegistered = () => {
        clearTimeout(timeout);
        this.device.removeListener('registered', onRegistered);
        this.device.removeListener('error', onError);
        resolve();
      };

      const onError = (error) => {
        clearTimeout(timeout);
        this.device.removeListener('registered', onRegistered);
        this.device.removeListener('error', onError);
        
        // 某些错误是可以重试的
        if (this.isRetryableError(error) && this.registrationAttempts < this.maxRegistrationAttempts) {
          this.registrationAttempts++;
          console.warn(`Registration attempt ${this.registrationAttempts} failed, retrying...`);
          setTimeout(() => {
            this.waitForRegistration().then(resolve).catch(reject);
          }, 2000);
        } else {
          reject(error);
        }
      };

      this.device.on('registered', onRegistered);
      this.device.on('error', onError);
    });
  }

  // 设置设备事件监听器
  setupDeviceListeners() {
    if (!this.device) return;

    // 设备状态变化
    this.device.on('registered', () => {
      this.setState({
        deviceState: 'registered',
        isRegistered: true,
        isReady: true,
        lastError: null
      });
      this.emit('registered');
    });

    this.device.on('unregistered', () => {
      this.setState({
        deviceState: 'unregistered',
        isRegistered: false,
        isReady: false
      });
      this.emit('unregistered');
    });

    this.device.on('offline', () => {
      this.setState({
        deviceState: 'offline',
        isRegistered: false,
        isReady: false
      });
      this.emit('offline');
      
      // 自动重连
      this.scheduleReconnection();
    });

    // 来电处理
    this.device.on('incoming', (call) => {
      this.emit('incomingCall', { call });
    });

    // 错误处理
    this.device.on('error', (error) => {
      this.setState({ lastError: error });
      this.handleDeviceError(error);
    });
  }

  // 处理设备错误
  handleDeviceError(error) {
    const errorCode = error.code;
    const errorMessage = error.message;

    console.error(`Device error ${errorCode}:`, errorMessage);

    switch (errorCode) {
      case 31000: // UnknownError
        this.emit('error', {
          type: 'unknown',
          code: errorCode,
          message: '网络或配置问题',
          canRetry: true
        });
        break;

      case 31005: // ConnectionError
        this.emit('error', {
          type: 'connection',
          code: errorCode,
          message: '连接错误',
          canRetry: true
        });
        break;

      case 31204: // Media connection failed
      case 31008: // Media connection failed
        this.emit('error', {
          type: 'media',
          code: errorCode,
          message: '媒体连接失败',
          canRetry: false
        });
        break;

      case 20104: // AccessTokenExpired
        this.emit('error', {
          type: 'token_expired',
          code: errorCode,
          message: 'Token已过期',
          canRetry: false
        });
        break;

      default:
        this.emit('error', {
          type: 'unknown',
          code: errorCode,
          message: errorMessage,
          canRetry: this.isRetryableError(error)
        });
    }
  }

  // 判断错误是否可重试
  isRetryableError(error) {
    if (!error || !error.code) return false;
    
    const retryableCodes = [
      31000, // UnknownError - 网络问题
      31005, // ConnectionError - 连接问题
      31201, // Media connection failed
      31202, // Media connection failed
      31203, // Media connection failed
    ];
    
    return retryableCodes.includes(error.code);
  }

  // 安排重连
  scheduleReconnection() {
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
    }

    this.reconnectionTimeout = setTimeout(async () => {
      if (!this.isInitialized || this.device?.state === 'registered') {
        return;
      }

      console.log('Attempting to reconnect device...');
      try {
        // 这里可能需要重新获取token
        this.emit('reconnectionAttempt');
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, 5000); // 5秒后重连
  }

  // 重新初始化设备
  async reinitialize(newToken, options = {}) {
    try {
      const wasInitialized = this.isInitialized;
      
      // 保存当前的监听器
      const currentListeners = this.listeners;
      
      // 销毁当前设备
      if (this.device) {
        this.device.removeAllListeners();
        this.device.destroy();
        this.device = null;
      }

      // 重新初始化
      const result = await this.initialize(newToken, options);
      
      if (result.success && wasInitialized) {
        // 恢复监听器
        this.listeners = currentListeners;
        this.emit('reinitialized', { device: this.device });
      }

      return result;
    } catch (error) {
      this.handleError(error, { operation: 'reinitialize' });
      return { success: false, error: error.message };
    }
  }

  // 获取设备状态
  getDeviceStatus() {
    if (!this.device) {
      return {
        initialized: false,
        state: 'uninitialized',
        registered: false,
        ready: false
      };
    }

    return {
      initialized: this.isInitialized,
      state: this.device.state,
      registered: this.device.state === 'registered',
      ready: this.device.state === 'registered',
      identity: this.device.identity,
      edge: this.device.edge,
      home: this.device.home
    };
  }

  // 获取设备实例
  getDevice() {
    return this.device;
  }

  // 检查设备是否就绪
  isReady() {
    return this.device && this.device.state === 'registered';
  }

  // 销毁设备
  async destroy() {
    try {
      if (this.reconnectionTimeout) {
        clearTimeout(this.reconnectionTimeout);
        this.reconnectionTimeout = null;
      }

      if (this.device) {
        this.device.removeAllListeners();
        this.device.destroy();
        this.device = null;
      }

      this.setState({
        deviceState: 'destroyed',
        isRegistered: false,
        isReady: false
      });

      this.isInitialized = false;
      this.emit('destroyed');

    } catch (error) {
      this.handleError(error, { operation: 'destroy' });
    }

    super.destroy();
  }
}

export default DeviceManager;
