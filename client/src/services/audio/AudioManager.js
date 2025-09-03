import { BaseService } from '../core/BaseService.js';

/**
 * 音频管理服务
 * 处理音频上下文、设备管理和权限
 */
export class AudioManager extends BaseService {
  constructor() {
    super('AudioManager');
    this.audioContext = null;
    this.inputDevices = [];
    this.outputDevices = [];
    this.currentInputDevice = null;
    this.currentOutputDevice = null;
    this.permissionStatus = 'unknown';
    this.state = {
      contextState: 'suspended',
      permissionGranted: false,
      devicesLoaded: false
    };
  }

  // 初始化音频管理器
  async initialize() {
    try {
      await this.initializeAudioContext();
      await this.loadAudioDevices();
      await this.checkPermissions();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      return { success: true };
    } catch (error) {
      this.handleError(error, { operation: 'initialize' });
      return { success: false, error: error.message };
    }
  }

  // 初始化音频上下文
  async initializeAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      throw new Error('AudioContext not supported');
    }

    this.audioContext = new AudioCtx();
    this.setState({ contextState: this.audioContext.state });

    // 监听状态变化
    this.audioContext.addEventListener('statechange', () => {
      this.setState({ contextState: this.audioContext.state });
      this.emit('contextStateChange', this.audioContext.state);
    });

    return this.audioContext;
  }

  // 恢复音频上下文
  async resumeAudioContext() {
    if (!this.audioContext) {
      await this.initializeAudioContext();
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.withTimeout(this.audioContext.resume(), 2000);
        console.log('Audio context resumed successfully');
        return true;
      } catch (error) {
        console.warn('Audio context resume failed:', error);
        return false;
      }
    }

    return true;
  }

  // 检查音频上下文状态
  getAudioContextState() {
    return {
      supported: !!(window.AudioContext || window.webkitAudioContext),
      state: this.audioContext?.state || 'unknown',
      sampleRate: this.audioContext?.sampleRate,
      baseLatency: this.audioContext?.baseLatency
    };
  }

  // 加载音频设备
  async loadAudioDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new Error('Media devices not supported');
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      this.inputDevices = devices.filter(device => device.kind === 'audioinput');
      this.outputDevices = devices.filter(device => device.kind === 'audiooutput');
      
      this.setState({ devicesLoaded: true });
      this.emit('devicesLoaded', {
        input: this.inputDevices,
        output: this.outputDevices
      });

      return {
        input: this.inputDevices,
        output: this.outputDevices
      };
    } catch (error) {
      this.handleError(error, { operation: 'loadAudioDevices' });
      throw error;
    }
  }

  // 获取音频输入设备
  getInputDevices() {
    return [...this.inputDevices];
  }

  // 获取音频输出设备
  getOutputDevices() {
    return [...this.outputDevices];
  }

  // 设置音频输入设备
  async setInputDevice(deviceId) {
    try {
      const device = this.inputDevices.find(d => d.deviceId === deviceId);
      if (!device) {
        throw new Error('Input device not found');
      }

      this.currentInputDevice = device;
      this.emit('inputDeviceChanged', device);
      
      return { success: true, device };
    } catch (error) {
      this.handleError(error, { operation: 'setInputDevice', deviceId });
      return { success: false, error: error.message };
    }
  }

  // 设置音频输出设备
  async setOutputDevice(deviceId) {
    try {
      const device = this.outputDevices.find(d => d.deviceId === deviceId);
      if (!device) {
        throw new Error('Output device not found');
      }

      this.currentOutputDevice = device;
      this.emit('outputDeviceChanged', device);
      
      return { success: true, device };
    } catch (error) {
      this.handleError(error, { operation: 'setOutputDevice', deviceId });
      return { success: false, error: error.message };
    }
  }

  // 检查麦克风权限
  async checkPermissions() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          success: false,
          error: 'Media devices not supported',
          permission: 'unsupported'
        };
      }

      // 检查权限API
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          this.permissionStatus = permission.state;
          
          permission.addEventListener('change', () => {
            this.permissionStatus = permission.state;
            this.setState({ permissionGranted: permission.state === 'granted' });
            this.emit('permissionChanged', permission.state);
          });

          return {
            success: true,
            permission: permission.state,
            granted: permission.state === 'granted'
          };
        } catch (permError) {
          console.warn('Permission API not available:', permError);
        }
      }

      // 降级检查：尝试获取媒体流
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        this.permissionStatus = 'granted';
        this.setState({ permissionGranted: true });
        
        return {
          success: true,
          permission: 'granted',
          granted: true
        };
      } catch (mediaError) {
        this.permissionStatus = 'denied';
        this.setState({ permissionGranted: false });
        
        return {
          success: false,
          permission: 'denied',
          granted: false,
          error: mediaError.message
        };
      }
    } catch (error) {
      this.handleError(error, { operation: 'checkPermissions' });
      return {
        success: false,
        error: error.message,
        permission: 'unknown'
      };
    }
  }

  // 请求麦克风权限
  async requestPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // 立即停止流，我们只是为了获取权限
      stream.getTracks().forEach(track => track.stop());
      
      this.permissionStatus = 'granted';
      this.setState({ permissionGranted: true });
      this.emit('permissionGranted');
      
      return {
        success: true,
        permission: 'granted'
      };
    } catch (error) {
      this.permissionStatus = 'denied';
      this.setState({ permissionGranted: false });
      this.emit('permissionDenied', error);
      
      const errorMessage = this.getPermissionErrorMessage(error);
      
      return {
        success: false,
        permission: 'denied',
        error: errorMessage
      };
    }
  }

  // 获取权限错误消息
  getPermissionErrorMessage(error) {
    switch (error.name) {
      case 'NotAllowedError':
        return '麦克风权限被拒绝。请在浏览器设置中允许麦克风访问。';
      case 'NotFoundError':
        return '未找到麦克风设备。请检查设备连接。';
      case 'NotReadableError':
        return '麦克风设备被其他应用占用。请关闭其他使用麦克风的应用。';
      case 'OverconstrainedError':
        return '麦克风设备不支持请求的配置。';
      case 'SecurityError':
        return '安全限制阻止了麦克风访问。请使用HTTPS连接。';
      default:
        return `麦克风访问失败: ${error.message}`;
    }
  }

  // 测试音频设备
  async testAudioDevices() {
    try {
      const constraints = {
        audio: {
          deviceId: this.currentInputDevice?.deviceId,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 创建音频分析器
      const analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // 测试5秒钟
      const testDuration = 5000;
      const startTime = Date.now();
      let maxVolume = 0;
      
      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        maxVolume = Math.max(maxVolume, volume);
        
        if (Date.now() - startTime < testDuration) {
          requestAnimationFrame(checkVolume);
        } else {
          // 停止测试
          stream.getTracks().forEach(track => track.stop());
          source.disconnect();
          
          this.emit('audioTestComplete', {
            maxVolume,
            success: maxVolume > 10 // 简单的音量阈值检查
          });
        }
      };
      
      checkVolume();
      
      return {
        success: true,
        message: 'Audio test started'
      };
    } catch (error) {
      this.handleError(error, { operation: 'testAudioDevices' });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取当前状态
  getStatus() {
    return {
      ...this.getState(),
      permissionStatus: this.permissionStatus,
      currentInputDevice: this.currentInputDevice,
      currentOutputDevice: this.currentOutputDevice,
      audioContext: this.getAudioContextState()
    };
  }

  // 清理资源
  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    super.destroy();
  }
}

export default AudioManager;
