import { Device } from '@twilio/voice-sdk';

class TwilioService {
  constructor() {
    this.device = null;
    this.token = null;
    this.isInitialized = false;
    this.currentCall = null;
    this.onCallStatusChange = null;
    this.isRefreshingToken = false; // 防止并发刷新
  }

  // 确保音频上下文在用户交互后启动
  async ensureAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioContext = new AudioCtx();
        if (audioContext.state === 'suspended') {
          // 添加2秒超时，防止卡死
          const resumePromise = audioContext.resume();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Audio context timeout')), 2000)
          );
          
          try {
            await Promise.race([resumePromise, timeoutPromise]);
            console.log('Audio context resumed');
          } catch (error) {
            console.warn('Audio context resume timeout or failed:', error);
          }
        }
      }
    } catch (error) {
      console.warn('Audio context error:', error);
    }
  }

  // 初始化Twilio设备 - 更保守的版本
  async initialize(token) {
    try {
      if (!token || token.startsWith('demo_token_')) {
        console.warn('⚠️ Invalid Twilio token, using demo mode');
        this.isInitialized = false;
        return { success: false, error: 'Demo mode - real calling requires valid Twilio configuration.' };
      }

      this.token = token;
      
      // 尝试启动音频上下文（静默处理）
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioContext = new AudioCtx();
          if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {}); // 静默失败
          }
        }
      } catch (audioError) {
        // 静默处理音频错误
        console.warn('⚠️ Audio context initialization warning:', audioError.message);
      }
      
      // 创建设备和设置监听器 - 更保守和稳定的配置
      try {
        this.device = new Device(token, {
          // 音频约束 - 使用更稳定的配置
          codecPreferences: ['opus', 'pcmu'],
          // 禁用DSCP以避免网络问题
          enableDscp: false,
          // 关闭调试以减少日志噪音
          debug: false,
          // 使用自动边缘选择，提高连接稳定性
          allowIncomingWhileBusy: false,
          // 降低比特率以提高兼容性
          maxAverageBitrate: 10000,
          // 添加连接超时设置
          closeProtection: false,
          // 使用更保守的音频设置
          enableImprovedSignalingErrorPrecision: true,
          // 优化WebRTC配置 - 更保守的设置
          rtcConfiguration: {
            iceServers: [
              { urls: 'stun:global.stun.twilio.com:3478' }
            ],
            iceCandidatePoolSize: 2,
            iceTransportPolicy: 'all',
            bundlePolicy: 'balanced'
          },
          // 增加连接超时时间
          connectionTimeout: 10000,
          // 增强错误恢复机制
          enableRingingState: true
        });
      } catch (deviceError) {
        console.error('❌ Failed to create Twilio device:', deviceError);
        return { 
          success: false, 
          error: `设备创建失败: ${deviceError.message}`,
          canRetry: true
        };
      }
      this.setupEventListeners();

      // 更稳定和容错的注册等待机制
      if (this.device.state === 'registered') {
        // 已注册，立即完成
        console.log('✅ Device already registered');
      } else {
        // 等待注册，增加更强的重试机制和错误恢复
        console.log('⏳ Waiting for device registration...');
        let registered = false;
        let registrationAttempts = 0;
        const maxAttempts = 3;
        
        try {
          await new Promise((resolve, reject) => {
            const attemptRegistration = () => {
              registrationAttempts++;
              console.log(`📞 Registration attempt ${registrationAttempts}/${maxAttempts}`);
              
              const timeout = setTimeout(() => {
                if (!registered && registrationAttempts < maxAttempts) {
                  console.warn(`⚠️ Registration attempt ${registrationAttempts} timed out, retrying...`);
                  if (this.device) {
                    this.device.removeAllListeners('registered');
                    this.device.removeAllListeners('error');
                  }
                  attemptRegistration();
                } else if (!registered) {
                  console.warn('⚠️ All registration attempts failed, continuing anyway');
                  resolve();
                }
              }, 5000); // 每次尝试5秒超时
              
              const onRegistered = () => {
                registered = true;
                clearTimeout(timeout);
                if (this.device) {
                  this.device.removeAllListeners('registered');
                  this.device.removeAllListeners('error');
                }
                console.log('✅ Device registered successfully');
                resolve();
              };
              
              const onError = (error) => {
                clearTimeout(timeout);
                if (this.device) {
                  this.device.removeAllListeners('registered');
                  this.device.removeAllListeners('error');
                }
                
                // 针对特定错误进行处理和重试
                if (error.code === 31000 || error.code === 31005) {
                  if (registrationAttempts < maxAttempts) {
                    console.warn(`⚠️ Registration error ${error.code}, retrying in 2s...`);
                    setTimeout(attemptRegistration, 2000);
                  } else {
                    console.warn('⚠️ Max registration attempts reached, continuing anyway');
                    resolve();
                  }
                } else {
                  console.warn('⚠️ Registration error:', error);
                  if (registrationAttempts < maxAttempts) {
                    setTimeout(attemptRegistration, 1000);
                  } else {
                    resolve();
                  }
                }
              };
              
              this.device.once('registered', onRegistered);
              this.device.once('error', onError);
            };
            
            attemptRegistration();
          });
        } catch (regError) {
          console.warn('⚠️ Registration process error:', regError);
          // 继续初始化，不阻断流程
        }
      }

      this.isInitialized = true;
      console.log('✅ Twilio device initialized');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error initializing Twilio device:', error);
      return { success: false, error: error.message };
    }
  }

  // 设置事件监听器
  setupEventListeners() {
    if (!this.device) return;

    // 设备就绪
    this.device.on('ready', () => {
      console.log('Twilio device is ready');
    });

    // 设备错误 - 增强错误处理和恢复机制
    this.device.on('error', async (error) => {
      console.error('Twilio device error:', error);

      // 针对特定错误代码进行处理和自动恢复
      if (error.code === 31000) {
        console.warn('🔧 Handling UnknownError (31000) - network or configuration issue');
        // 31000通常是网络连接问题，尝试重新初始化
        if (this.onCallStatusChange) {
          this.onCallStatusChange('error', {
            error: '网络连接不稳定，正在尝试重新连接...',
            code: 'NETWORK_ERROR',
            canRetry: true,
            autoRetry: true
          });
        }
        
        // 延迟重新初始化
        setTimeout(async () => {
          if (!this.isInitialized && this.token) {
            console.log('🔄 Auto-retrying initialization due to 31000 error');
            try {
              await this.initialize(this.token);
            } catch (retryError) {
              console.error('❌ Auto-retry failed:', retryError);
            }
          }
        }, 3000);
        return;
      }
      
      if (error.code === 31005) {
        console.warn('🔧 Handling ConnectionError (31005) - call connection issue');
        // 31005是通话连接错误，提供重试建议
        if (this.onCallStatusChange) {
          this.onCallStatusChange('error', {
            error: '通话连接失败，请检查网络后重试',
            code: 'CONNECTION_ERROR',
            canRetry: true,
            retryDelay: 5000
          });
        }
        return;
      }
      
      // 处理新增的网络相关错误
      if (error.code === 31204 || error.code === 31008) {
        console.warn('🔧 Handling media connection error:', error.code);
        if (this.onCallStatusChange) {
          this.onCallStatusChange('error', {
            error: '媒体连接失败，请检查网络设置',
            code: 'MEDIA_ERROR',
            canRetry: true
          });
        }
        return;
      }

      // 处理 AccessTokenExpired 错误
      if (error.code === 20104 || error.message?.includes('AccessTokenExpired')) {
        console.log('🔄 检测到 AccessTokenExpired 错误，尝试刷新 token...');

        try {
          const refreshResult = await this.refreshToken();
          if (refreshResult.success) {
            console.log('✅ Token 刷新成功，设备已重新初始化');
            if (this.onCallStatusChange) {
              this.onCallStatusChange('token_refreshed', { message: 'Token 已刷新，请重试通话' });
            }
            return;
          }
        } catch (refreshError) {
          console.error('❌ Token 刷新失败:', refreshError);
        }

        // 如果刷新失败，提供友好的错误信息
        if (this.onCallStatusChange) {
          this.onCallStatusChange('error', {
            error: 'Token 已过期，请刷新页面重新登录',
            code: 'TOKEN_EXPIRED',
            needsReload: true
          });
        }
      } else {
        // 其他错误的处理
        if (this.onCallStatusChange) {
          this.onCallStatusChange('error', { 
            error: this.formatErrorMessage(error),
            code: error.code || 'UNKNOWN_ERROR',
            canRetry: this.isRetryableError(error)
          });
        }
      }
    });

    // 来电
    this.device.on('incoming', (call) => {
      console.log('Incoming call from:', call.parameters.From);
      this.currentCall = call;
      
      if (this.onCallStatusChange) {
        this.onCallStatusChange('incoming', {
          from: call.parameters.From,
          call: call
        });
      }

      // 设置通话事件监听器
      this.setupCallListeners(call);
    });

    // 设备断开连接 - 增强离线处理
    this.device.on('offline', () => {
      console.log('Twilio device went offline');
      if (this.onCallStatusChange) {
        this.onCallStatusChange('offline', {
          error: '设备已离线，正在尝试重新连接...',
          code: 'DEVICE_OFFLINE',
          autoRetry: true
        });
      }
      
      // 自动尝试重新连接
      setTimeout(async () => {
        if (this.token && !this.isInitialized) {
          console.log('🔄 Auto-reconnecting after offline event');
          try {
            await this.initialize(this.token);
          } catch (reconnectError) {
            console.error('❌ Auto-reconnect failed:', reconnectError);
          }
        }
      }, 5000);
    });

    // 设备重新上线
    this.device.on('registered', () => {
      console.log('✅ Device registered/re-registered');
      if (this.onCallStatusChange) {
        this.onCallStatusChange('registered', {
          message: '设备已连接，可以拨打电话',
          code: 'DEVICE_READY'
        });
      }
    });
  }

  // 设置通话事件监听器
  setupCallListeners(call) {
    call.on('accept', () => {
      console.log('✅ Call accepted');
      if (this.onCallStatusChange) {
        this.onCallStatusChange('accepted', { call });
      }
    });

    call.on('disconnect', (error) => {
      console.log('📞 ===== CALL DISCONNECTED =====');
      console.log('📞 Call status before disconnect:', call.status ? call.status() : 'unknown');
      console.log('📞 Call duration:', call.duration || 'unknown');
      
      if (error) {
        console.error('❌ Disconnect reason:', error);
      } else {
        console.log('✅ Call ended normally');
      }
      
      console.log('📞 ============================');
      
      this.currentCall = null;
      console.log('📞 Checking callback:', !!this.onCallStatusChange);
      if (this.onCallStatusChange) {
        console.log('📞 Calling onCallStatusChange with disconnected status');
        this.onCallStatusChange('disconnected', { call, error });
      } else {
        console.error('❌ onCallStatusChange callback is not set!');
      }
    });

    call.on('cancel', () => {
      console.log('📞 Call cancelled');
      this.currentCall = null;
      if (this.onCallStatusChange) {
        this.onCallStatusChange('cancelled', { call });
      }
    });

    call.on('reject', () => {
      console.log('📞 Call rejected');
      this.currentCall = null;
      if (this.onCallStatusChange) {
        this.onCallStatusChange('rejected', { call });
      }
    });

    call.on('error', async (error) => {
      console.error('❌ Call error:', error);

      // 处理 AccessTokenExpired 错误
      if (error.code === 20104 || error.message?.includes('AccessTokenExpired')) {
        console.log('🔄 通话中检测到 AccessTokenExpired 错误，尝试刷新 token...');

        try {
          const refreshResult = await this.refreshToken();
          if (refreshResult.success) {
            if (this.onCallStatusChange) {
              this.onCallStatusChange('error', {
                error: 'Token 已过期并已刷新，请重新发起通话',
                code: 'TOKEN_EXPIRED_REFRESHED',
                call
              });
            }
            return;
          }
        } catch (refreshError) {
          console.error('❌ 通话中 Token 刷新失败:', refreshError);
        }

        if (this.onCallStatusChange) {
          this.onCallStatusChange('error', {
            error: 'Token 已过期，请刷新页面重新登录',
            code: 'TOKEN_EXPIRED',
            needsReload: true,
            call
          });
        }
      } else {
        if (this.onCallStatusChange) {
          this.onCallStatusChange('error', {
            error: this.formatErrorMessage(error),
            call
          });
        }
      }
    });

    // 添加更多事件监听来调试
    call.on('ringing', () => {
      console.log('📞 Call is ringing');
      if (this.onCallStatusChange) {
        this.onCallStatusChange('ringing', { call });
      }
    });

    call.on('connecting', () => {
      console.log('📞 Call is connecting');
      if (this.onCallStatusChange) {
        this.onCallStatusChange('connecting', { call });
      }
    });

    call.on('connected', () => {
      console.log('📞 Call is connected');
      if (this.onCallStatusChange) {
        this.onCallStatusChange('connected', { call });
      }
    });
    
    // 添加更多稳定性事件监听
    call.on('sample', (sample) => {
      // 实时音频质量监控（可选）
      if (sample && sample.inputVolume !== undefined) {
        // 可以在这里监控音频质量
      }
    });
    
    call.on('warning', (name, data) => {
      console.warn('⚠️ Call warning:', name, data);
      // 可以根据警告类型做相应处理
    });
  }

  // 恢复音频上下文（在用户交互时调用）
  async resumeAudioContext() {
    try {
      const AudioCtx = (window.AudioContext || window.webkitAudioContext);
      if (AudioCtx) {
        const audioContext = new AudioCtx();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('🎵 Audio context resumed successfully');
          
          // 如果设备已初始化但由于音频上下文问题未就绪，尝试重新初始化
          if (this.device && this.device.state !== 'ready' && this.token) {
            console.log('🔄 Re-initializing Twilio device after audio context resume');
            this.setupEventListeners();
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not resume audio context:', error);
    }
  }

  // 检查音频上下文状态
  checkAudioContextState() {
    try {
      const AudioCtx = (window.AudioContext || window.webkitAudioContext);
      if (AudioCtx) {
        const audioContext = new AudioCtx();
        return {
          supported: true,
          state: audioContext.state,
          needsInteraction: audioContext.state === 'suspended'
        };
      }
      return { supported: false, state: 'unsupported', needsInteraction: false };
    } catch (error) {
      console.warn('⚠️ Audio context check failed:', error);
      return { supported: false, state: 'error', needsInteraction: false };
    }
  }
  
  // 简化的ICE服务器配置
  getOptimalICEServers() {
    // 只使用基础的Twilio服务器
    return [
      { urls: 'stun:global.stun.twilio.com:3478' }
    ];
  }
  
  
  // 验证 Twilio Token - 向后兼容版本
  validateToken(token, returnDetailedResult = false) {
    try {
      // 基础格式检查
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // 解码 payload（不验证签名）
      const payload = JSON.parse(atob(parts[1]));

      console.log('🔍 Token 验证:');
      console.log('- 颁发者 (iss):', payload.iss);
      console.log('- 主体 (sub):', payload.sub);
      console.log('- 身份 (identity):', payload.grants?.identity || payload.identity);
      console.log('- 过期时间:', new Date(payload.exp * 1000).toLocaleString());

      // 检查是否已过期
      const currentTime = Date.now() / 1000;
      const timeLeft = payload.exp - currentTime;

      if (timeLeft <= 0) {
        throw new Error('Token 已过期');
      }

      // 检查语音授权
      if (!payload.grants || !payload.grants.voice) {
        throw new Error('Token 缺少语音通话授权');
      }

      const voiceGrant = payload.grants.voice;
      console.log('📞 语音授权:');
      console.log('- 出站应用 SID:', voiceGrant.outgoing?.application_sid);
      console.log('- 允许入站:', voiceGrant.incoming?.allow);

      if (!voiceGrant.outgoing?.application_sid) {
        throw new Error('Token 缺少 TwiML 应用 SID');
      }

      console.log('✅ Token 验证通过');

      // 如果需要详细结果，返回对象；否则返回布尔值（向后兼容）
      if (returnDetailedResult) {
        // 检查是否即将过期（10分钟内）
        const needsRefresh = timeLeft < 600;
        if (needsRefresh) {
          console.warn('⚠️ Token 即将过期，剩余时间:', Math.round(timeLeft / 60), '分钟');
        }
        return { valid: true, needsRefresh, timeLeft };
      } else {
        return true; // 向后兼容：返回布尔值
      }

    } catch (error) {
      console.error('❌ Token 验证失败:', error.message);
      throw new Error(`Token 验证失败: ${error.message}`);
    }
  }

  // 检查当前 token 是否需要刷新
  async checkTokenExpiry() {
    try {
      if (!this.token) {
        return { needsRefresh: true, reason: 'No token available' };
      }

      const validation = this.validateToken(this.token, true);

      if (validation.needsRefresh) {
        return {
          needsRefresh: true,
          reason: 'Token expiring soon',
          timeLeft: validation.timeLeft
        };
      }

      return { needsRefresh: false, timeLeft: validation.timeLeft };
    } catch (error) {
      console.error('❌ Token 过期检查失败:', error.message);
      return {
        needsRefresh: true,
        reason: error.message.includes('已过期') ? 'Token expired' : 'Token invalid',
        error: error.message
      };
    }
  }

  // 刷新 Twilio Token
  async refreshToken() {
    // 防止并发刷新
    if (this.isRefreshingToken) {
      console.log('🔄 Token 刷新已在进行中，等待完成...');
      // 等待当前刷新完成
      while (this.isRefreshingToken) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return { success: true, token: this.token };
    }

    this.isRefreshingToken = true;

    try {
      console.log('🔄 正在刷新 Twilio token...');

      const userToken = localStorage.getItem('token');
      if (!userToken) {
        throw new Error('用户未登录，无法刷新 Twilio token');
      }

      const response = await fetch('/api/twilio/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('用户认证失败，请重新登录');
        } else if (errorData.errorCode === 'TWILIO_NOT_CONFIGURED') {
          throw new Error('Twilio 服务未配置');
        } else {
          throw new Error(`Token 刷新失败: ${response.status}`);
        }
      }

      const tokenData = await response.json();

      if (!tokenData.success || !tokenData.token) {
        throw new Error('服务器返回无效的 token 数据');
      }

      // 验证新 token
      const validation = this.validateToken(tokenData.token, true);
      if (!validation.valid) {
        throw new Error('服务器返回的新 token 无效');
      }

      // 更新 token
      this.token = tokenData.token;

      // 如果设备已初始化，需要重新初始化以使用新 token
      if (this.device) {
        console.log('🔄 使用新 token 重新初始化设备...');
        await this.reinitializeDevice(tokenData.token);
      }

      console.log('✅ Twilio token 刷新成功');
      return { success: true, token: tokenData.token };

    } catch (error) {
      console.error('❌ Token 刷新失败:', error.message);
      return { success: false, error: error.message };
    } finally {
      this.isRefreshingToken = false;
    }
  }

  // 重新初始化设备（使用新 token）
  async reinitializeDevice(newToken) {
    try {
      // 检查是否有活跃通话
      if (this.currentCall && this.currentCall.status && this.currentCall.status() === 'open') {
        console.log('⚠️ 有活跃通话，延迟设备重新初始化');
        // 只更新 token，不重新初始化设备
        this.token = newToken;
        return { success: true, deferred: true };
      }

      // 保存当前状态
      const wasInitialized = this.isInitialized;
      const currentCallbacks = this.onCallStatusChange;

      // 清理旧设备
      if (this.device) {
        this.device.removeAllListeners();
        this.device.destroy();
        this.device = null;
      }

      // 重置状态
      this.isInitialized = false;
      this.token = newToken;

      // 重新初始化
      const result = await this.initialize(newToken);

      if (result.success && wasInitialized) {
        // 恢复回调
        this.onCallStatusChange = currentCallbacks;
        console.log('✅ 设备重新初始化成功');
      }

      return result;
    } catch (error) {
      console.error('❌ 设备重新初始化失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 确保 token 有效（自动刷新如果需要）
  async ensureValidToken() {
    try {
      const expiryCheck = await this.checkTokenExpiry();

      if (expiryCheck.needsRefresh) {
        console.log('🔄 Token 需要刷新:', expiryCheck.reason);
        const refreshResult = await this.refreshToken();

        if (!refreshResult.success) {
          throw new Error(`Token 刷新失败: ${refreshResult.error}`);
        }

        return { success: true, refreshed: true };
      }

      return { success: true, refreshed: false };
    } catch (error) {
      console.error('❌ 确保 token 有效失败:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 检查错误是否可重试
  isRetryableError(error) {
    if (!error || !error.code) return false;
    
    // 可重试的错误代码
    const retryableErrors = [
      31000, // UnknownError - 网络问题
      31001, // 无法连接到 Twilio 服务
      31002, // 连接超时
      31004, // 网络连接错误
      31005, // 连接丢失
      31008, // 媒体连接超时
      31204, // 媒体连接失败
      20104  // Token过期
    ];
    
    return retryableErrors.includes(error.code);
  }

  // 格式化错误信息
  formatErrorMessage(error) {
    if (!error) return 'Unknown error';

    // 处理 Twilio 特定错误代码
    switch (error.code) {
      case 20104:
        return 'Token 已过期，请刷新页面重新登录';
      case 21201:
        return '无效的电话号码格式';
      case 21202:
        return '电话号码不可达';
      case 21203:
        return '国际通话被限制';
      case 21210:
        return '发送方号码无效';
      case 21211:
        return '接收方号码无效';
      case 21214:
        return '电话号码不支持语音通话';
      case 21215:
        return '账户余额不足';
      case 21216:
        return '账户被暂停';
      case 21217:
        return '电话号码被列入黑名单';
      case 21218:
        return '无效的应用程序 SID';
      case 21219:
        return '无效的 URL';
      case 21220:
        return '无效的方法';
      case 21401:
        return '无效的电话号码';
      case 21402:
        return '无效的 URL';
      case 21403:
        return '无效的方法';
      case 21404:
        return '无效的应用程序 SID';
      case 21405:
        return '无效的电话号码';
      case 21406:
        return '无效的 Caller ID';
      case 21407:
        return '无效的 URL';
      case 21408:
        return '权限被拒绝';
      case 21421:
        return '电话号码不可用';
      case 21422:
        return '无效的电话号码';
      case 21423:
        return '国际通话权限不足';
      case 21424:
        return '无效的电话号码格式';
      case 31000:
        return '网络连接不稳定，请检查网络后重试';
      case 31001:
        return '无法连接到 Twilio 服务';
      case 31002:
        return '连接超时';
      case 31003:
        return '连接被拒绝';
      case 31004:
        return '网络连接错误';
      case 31005:
        return '连接丢失';
      case 31006:
        return '无法建立媒体连接';
      case 31007:
        return '媒体连接失败';
      case 31008:
        return '媒体连接超时';
      case 31009:
        return '媒体连接被拒绝';
      case 31204:
        return '媒体设备无法访问或连接失败';
      default:
        // 如果有具体的错误信息，使用它
        if (error.message) {
          // 处理常见的错误信息
          if (error.message.includes('AccessTokenExpired')) {
            return 'Token 已过期，请刷新页面重新登录';
          }
          if (error.message.includes('Invalid phone number')) {
            return '无效的电话号码格式';
          }
          if (error.message.includes('Permission denied')) {
            return '权限被拒绝，请检查麦克风权限';
          }
          if (error.message.includes('Network')) {
            return '网络连接错误，请检查网络连接';
          }
          return error.message;
        }
        return `通话错误 (${error.code || 'Unknown'})`;
    }
  }
  

  // 发起通话
  async makeCall(phoneNumber, callerIdNumber = null) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);

    try {
      console.log('📞 ===== MAKECALL DEBUG =====');
      console.log('📞 isInitialized:', this.isInitialized);
      console.log('📞 device:', !!this.device);
      console.log('📞 formattedNumber:', formattedNumber);

      if (!formattedNumber) {
        throw new Error('Invalid phone number');
      }

      // Demo模式检查 - 如果没有有效的webhook URL，提供demo通话体验
      const userToken = localStorage.getItem('token');
      console.log('📞 Token check:', userToken === 'mock-token' ? 'mock-token' : 'real-token');

      if (userToken === 'mock-token') {
        const appUrl = process.env.REACT_APP_API_URL || window.location.origin;
        console.log('📞 AppURL check:', appUrl);
        console.log('📞 Is localhost/127.0.0.1:', appUrl.includes('localhost') || appUrl.includes('127.0.0.1'));
        console.log('📞 Has ngrok:', appUrl.includes('ngrok'));
        
        if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1') || !appUrl.includes('ngrok')) {
          console.log('🎭 Demo mode: Simulating voice call for demonstration');
          // 在demo模式下提供模拟通话体验而不是报错
          return this.simulateDemoCall(formattedNumber);
        }
      }

      console.log('📞 Proceeding with REAL Twilio call');
      console.log('📞 ==========================')

      // 确保 token 有效（自动刷新如果需要）- 只在真实通话模式下
      console.log('🔍 检查 token 有效性...');
      const tokenCheck = await this.ensureValidToken();
      if (!tokenCheck.success) {
        throw new Error(`Token 验证失败: ${tokenCheck.error}`);
      }

      if (tokenCheck.refreshed) {
        console.log('✅ Token 已刷新，继续通话');
        // 如果设备重新初始化被延迟，确保设备仍然可用
        if (!this.isInitialized || !this.device) {
          throw new Error('设备在 token 刷新后需要重新初始化，请稍后重试');
        }
      }

      if (!this.isInitialized || !this.device) {
        throw new Error('Twilio device not initialized');
      }

      // 确保音频上下文已启动（用户交互时）
      await this.ensureAudioContext();
      
      console.log('📞 Making call to:', formattedNumber);
      console.log('📞 Using caller ID:', callerIdNumber);

      // 🔧 修复：无论是否有caller ID，都使用前端SDK建立双向音频连接
      // 通过参数传递caller ID给webhook处理
      console.log('📞 Using frontend SDK with caller ID parameter');
      
      const params = { To: formattedNumber };
      
      // 如果有指定的caller ID，通过参数传递给webhook
      if (callerIdNumber) {
        params.From = callerIdNumber;
        params.CallerID = callerIdNumber;
        params.callerId = callerIdNumber;
        console.log('📞 Passing caller ID to webhook:', callerIdNumber);
      }

      const call = await this.device.connect({ params });
      this.currentCall = call;
      
      console.log('✅ Frontend SDK call initiated successfully with params:', params);

      // 设置通话事件监听器
      this.setupCallListeners(call);

      if (this.onCallStatusChange) {
        this.onCallStatusChange('connecting', { to: formattedNumber, call });
      }
      
      return { success: true, call };
    } catch (error) {
      console.error('❌ Error making call:', error);

      // 处理 AccessTokenExpired 错误
      if (error.code === 20104 || error.message?.includes('AccessTokenExpired')) {
        console.log('🔄 发起通话时检测到 AccessTokenExpired 错误，尝试刷新 token...');

        try {
          const refreshResult = await this.refreshToken();
          if (refreshResult.success) {
            return {
              success: false,
              error: 'Token 已过期并已刷新，请重新发起通话',
              code: 'TOKEN_EXPIRED_REFRESHED',
              canRetry: true
            };
          }
        } catch (refreshError) {
          console.error('❌ 发起通话时 Token 刷新失败:', refreshError);
        }

        return {
          success: false,
          error: 'Token 已过期，请刷新页面重新登录',
          code: 'TOKEN_EXPIRED',
          needsReload: true
        };
      }

      return {
        success: false,
        error: this.formatErrorMessage(error),
        code: error.code
      };
    }
  }


  // 格式化电话号码
  formatPhoneNumber(phoneNumber) {
    // 移除所有非数字字符
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // 如果不以+开头，根据长度判断是否需要添加国家代码
    if (!phoneNumber.startsWith('+')) {
      if (cleaned.length === 10) {
        // 美国号码，添加+1
        return `+1${cleaned}`;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        // 已包含美国国家代码
        return `+${cleaned}`;
      } else {
        // 其他国际号码，保持原样
        return `+${cleaned}`;
      }
    }
    
    return phoneNumber;
  }

  // 接听通话
  acceptCall() {
    if (this.currentCall) {
      this.currentCall.accept();
      return { success: true };
    }
    return { success: false, error: 'No active call to accept' };
  }

  // 从队列接听来电
  async acceptQueuedCall(queueName) {
    try {
      console.log('📞 Accepting call from queue:', queueName);
      
      if (!this.device) {
        throw new Error('Twilio device not initialized');
      }

      // 确保音频上下文已激活
      await this.ensureAudioContext();
      
      // 连接到队列 - 添加连接选项
      const call = await this.device.connect({
        params: {
          QueueName: queueName
        },
        // 添加连接选项
        rtcConstraints: {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        }
      });

      this.currentCall = call;
      this.setupCallListeners(call);

      return { success: true, call };
    } catch (error) {
      console.error('❌ Error accepting queued call:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔔 接听来电 - 简化优化版本
  async acceptIncomingCall(callData) {
    try {
      console.log('📞 Accepting incoming call:', callData);
      
      if (!this.isInitialized || !this.device) {
        throw new Error('Twilio device not initialized');
      }

      // 确保音频上下文已激活
      await this.ensureAudioContext();
      
      // 方法1：如果有当前来电连接，直接接听
      if (this.currentCall) {
        console.log('📞 Found existing incoming call, accepting...');
        this.currentCall.accept();
        return { success: true, method: 'direct_accept' };
      }
      
      // 方法2：通过API通知服务器接受来电 - 简化版本
      console.log('📞 Notifying server about call acceptance...');
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/twilio/accept-incoming-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          callSid: callData.callSid,
          callId: callData.callId
        })
      });

      if (!response.ok) {
        let errorDetails = 'Unknown error';
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || errorData.details || 'Unknown error';
          console.log('📞 API error details:', errorData);
        } catch (parseError) {
          errorDetails = await response.text().catch(() => 'Unknown error');
        }
        
        // 针对不同的错误状态提供更友好的错误信息
        if (response.status === 400) {
          throw new Error(`Call cannot be accepted: ${errorDetails}`);
        } else if (response.status === 404) {
          throw new Error(`Incoming call not found: ${errorDetails}`);
        } else if (response.status === 503) {
          throw new Error(`Voice service unavailable: ${errorDetails}`);
        } else {
          throw new Error(`Failed to accept call via API: ${response.status} - ${errorDetails}`);
        }
      }

      const result = await response.json();
      console.log('📞 API response:', result);
      
      // 🔧 简化方案：只通知服务器，不在前端建立连接
      // 等待服务器或WebSocket通知进一步的连接指令
      console.log('📞 Call acceptance recorded, waiting for connection instructions...');
      
      // 🔧 修复：由于WebSocket来电没有触发Twilio SDK的incoming事件
      // 创建一个模拟的call对象来支持挂断等操作
      const simulatedCall = {
        callSid: result.callSid,
        callId: result.callId,
        method: 'api_notification',
        fromNumber: callData.fromNumber,
        toNumber: callData.toNumber,
        status: () => 'connected',
        disconnect: () => {
          console.log('📞 Disconnecting WebSocket-based call');
          if (this.onCallStatusChange) {
            this.onCallStatusChange('disconnected', { 
              call: simulatedCall,
              method: 'api_notification'
            });
          }
          this.currentCall = null;
        }
      };
      
      // 设置currentCall以支持挂断操作
      this.currentCall = simulatedCall;
      
      // 手动触发connected状态，确保UI能正确更新
      setTimeout(() => {
        console.log('📞 Manually triggering connected state for WebSocket-based call');
        if (this.onCallStatusChange) {
          this.onCallStatusChange('connected', { 
            callSid: result.callSid,
            callId: result.callId,
            method: 'api_notification',
            fromNumber: callData.fromNumber,
            toNumber: callData.toNumber,
            call: simulatedCall
          });
        }
      }, 1000); // 1秒延迟确保API调用完成
      
      return { 
        success: true, 
        message: 'Call accepted successfully',
        method: 'api_notification',
        callId: result.callId,
        callSid: result.callSid
      };
      
    } catch (error) {
      console.error('❌ Error accepting incoming call:', error);
      return { success: false, error: error.message };
    }
  }

  // 拒绝通话
  rejectCall() {
    if (this.currentCall) {
      this.currentCall.reject();
      this.currentCall = null;
      return { success: true };
    }
    return { success: false, error: 'No active call to reject' };
  }

  // 挂断通话
  hangupCall() {
    try {
      if (this.currentCall) {
        this.currentCall.disconnect();
        this.currentCall = null;
        return { success: true };
      }
      return { success: false, error: 'No active call to hang up' };
    } catch (error) {
      console.error('❌ Error hanging up call:', error);
      // 即使出错也清理状态
      this.currentCall = null;
      return { success: true, warning: 'Call ended but with error: ' + error.message };
    }
  }

  // 静音/取消静音
  toggleMute() {
    if (this.currentCall) {
      const isMuted = this.currentCall.isMuted();
      this.currentCall.mute(!isMuted);
      return { success: true, isMuted: !isMuted };
    }
    return { success: false, error: 'No active call' };
  }

  // 保持通话/取消保持
  toggleHold() {
    if (this.currentCall) {
      try {
        // 检查是否有hold方法
        if (typeof this.currentCall.hold === 'function') {
          // 简化实现，不检查当前状态
          this.currentCall.hold();
          return { success: true, isOnHold: true };
        } else {
          console.warn('Hold function not available in current Twilio SDK version');
          return { success: false, error: 'Hold function not supported' };
        }
      } catch (error) {
        console.error('Error toggling hold:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'No active call' };
  }

  // 发送DTMF音调
  sendDTMF(tone) {
    if (this.currentCall) {
      this.currentCall.sendDigits(tone);
      return { success: true };
    }
    return { success: false, error: 'No active call' };
  }

  // 获取当前通话状态
  getCallStatus() {
    if (this.currentCall) {
      try {
        return {
          hasActiveCall: true,
          callSid: this.currentCall.parameters?.CallSid || 'unknown',
          status: typeof this.currentCall.status === 'function' ? this.currentCall.status() : 'unknown',
          isMuted: typeof this.currentCall.isMuted === 'function' ? this.currentCall.isMuted() : false,
          isOnHold: false // 简化实现，不依赖可能不存在的方法
        };
      } catch (error) {
        console.error('Error getting call status:', error);
        return {
          hasActiveCall: true,
          callSid: 'unknown',
          status: 'unknown',
          isMuted: false,
          isOnHold: false
        };
      }
    }
    return { hasActiveCall: false };
  }

  // Demo 模式模拟通话
  simulateDemoCall(phoneNumber) {
    console.log('🎭 Starting demo call simulation to:', phoneNumber);
    
    // 模拟通话连接过程
    setTimeout(() => {
      if (this.onCallStatusChange) {
        this.onCallStatusChange('connecting', { number: phoneNumber });
      }
    }, 100);
    
    setTimeout(() => {
      if (this.onCallStatusChange) {
        this.onCallStatusChange('ringing', { number: phoneNumber });
      }
    }, 1000);
    
    setTimeout(() => {
      if (this.onCallStatusChange) {
        this.onCallStatusChange('connected', { number: phoneNumber });
      }
    }, 3000);
    
    // 可选：10秒后自动结束通话 (用于测试)
    setTimeout(() => {
      if (this.onCallStatusChange) {
        console.log('🎭 Demo call auto-ending after 10 seconds');
        this.onCallStatusChange('disconnected', { number: phoneNumber });
      }
    }, 13000); // 3秒连接 + 10秒通话
    
    return {
      success: true,
      message: 'Demo call simulation started',
      callSid: 'demo-call-' + Date.now()
    };
  }

  // 设置通话状态回调
  setCallStatusCallback(callback) {
    this.onCallStatusChange = callback;
  }

  // 销毁设备
  destroy() {
    try {
      if (this.currentCall) {
        this.currentCall.disconnect();
        this.currentCall = null;
      }
      if (this.device) {
        this.device.destroy();
        this.device = null;
      }
      this.isInitialized = false;
      this.token = null;
      console.log('✅ Twilio service destroyed successfully');
    } catch (error) {
      console.error('❌ Error destroying Twilio service:', error);
    }
  }

  // 检查设备状态
  getDeviceStatus() {
    return {
      isInitialized: this.isInitialized,
      isReady: this.device ? this.device.state === 'ready' : false,
      isRegistered: this.device ? this.device.state === 'registered' : false,
      hasActiveCall: !!this.currentCall,
      deviceState: this.device ? this.device.state : 'offline',
      identity: this.device ? this.device.identity : null,
      tokenPresent: !!this.token
    };
  }
  

  // 获取音频输入设备
  async getAudioInputDevices() {
    try {
      if (!this.device) {
        throw new Error('Device not initialized');
      }
      
      const devices = await this.device.audio.availableInputDevices.get();
      return { success: true, devices };
    } catch (error) {
      console.error('Error getting audio input devices:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取音频输出设备
  async getAudioOutputDevices() {
    try {
      if (!this.device) {
        throw new Error('Device not initialized');
      }
      
      const devices = await this.device.audio.availableOutputDevices.get();
      return { success: true, devices };
    } catch (error) {
      console.error('Error getting audio output devices:', error);
      return { success: false, error: error.message };
    }
  }

  // 设置音频输入设备
  async setAudioInputDevice(deviceId) {
    try {
      if (!this.device) {
        throw new Error('Device not initialized');
      }
      
      await this.device.audio.setInputDevice(deviceId);
      return { success: true };
    } catch (error) {
      console.error('Error setting audio input device:', error);
      return { success: false, error: error.message };
    }
  }

  // 设置音频输出设备
  async setAudioOutputDevice(deviceId) {
    try {
      if (!this.device) {
        throw new Error('Device not initialized');
      }
      
      await this.device.audio.setOutputDevice(deviceId);
      return { success: true };
    } catch (error) {
      console.error('Error setting audio output device:', error);
      return { success: false, error: error.message };
    }
  }

  // 测试音频设备
  async testAudioDevices() {
    try {
      if (!this.device) {
        throw new Error('Device not initialized');
      }

      const inputTest = await this.device.audio.testInputDevice();
      const outputTest = await this.device.audio.testOutputDevice();

      return {
        success: true,
        inputLevel: inputTest.volume,
        outputTest: outputTest
      };
    } catch (error) {
      console.error('Error testing audio devices:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取网络质量信息
  getNetworkQuality() {
    if (!this.currentCall) {
      return { success: false, error: 'No active call' };
    }

    try {
      const stats = this.currentCall.getRemoteStream().getAudioTracks()[0].getStats();
      return { success: true, stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 启用/禁用回声消除
  setEchoCancellation(enabled) {
    try {
      if (!this.device) {
        throw new Error('Device not initialized');
      }
      
      // 这个功能取决于Twilio SDK版本
      if (this.device.audio.setEchoCancellation) {
        this.device.audio.setEchoCancellation(enabled);
        return { success: true };
      } else {
        return { success: false, error: 'Echo cancellation not supported' };
      }
    } catch (error) {
      console.error('Error setting echo cancellation:', error);
      return { success: false, error: error.message };
    }
  }

  // 启用/禁用噪声抑制
  setNoiseSuppression(enabled) {
    try {
      if (!this.device) {
        throw new Error('Device not initialized');
      }
      
      // 这个功能取决于Twilio SDK版本
      if (this.device.audio.setNoiseSuppression) {
        this.device.audio.setNoiseSuppression(enabled);
        return { success: true };
      } else {
        return { success: false, error: 'Noise suppression not supported' };
      }
    } catch (error) {
      console.error('Error setting noise suppression:', error);
      return { success: false, error: error.message };
    }
  }

  // 检查麦克风权限
  async checkMicrophonePermission() {
    try {
      // 检查浏览器是否支持getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          success: false,
          error: 'Browser does not support microphone access',
          needsUpgrade: true
        };
      }

      // 检查权限API是否可用
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          
          switch (permission.state) {
            case 'granted':
              return { success: true, status: 'granted' };
            case 'denied':
              return { 
                success: false, 
                status: 'denied',
                error: 'Microphone access denied. Please enable microphone permission in browser settings.'
              };
            case 'prompt':
              return { success: true, status: 'prompt', needsRequest: true };
            default:
              return { success: true, status: 'unknown', needsRequest: true };
          }
        } catch (permError) {
          console.warn('Permission API not supported:', permError);
          // Fall back to direct media request
          return { success: true, status: 'unknown', needsRequest: true };
        }
      } else {
        // Permissions API not supported, try direct access
        return { success: true, status: 'unknown', needsRequest: true };
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return { success: false, error: error.message };
    }
  }

  // 请求麦克风权限
  async requestMicrophonePermission() {
    try {
      console.log('🎤 Requesting microphone permission...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // 立即停止流，我们只是测试权限
      stream.getTracks().forEach(track => track.stop());
      
      console.log('✅ Microphone permission granted');
      return { success: true, granted: true };
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      
      let errorMessage = 'Failed to access microphone';
      let errorCode = 'unknown';
      
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
          errorCode = 'permission_denied';
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
          errorCode = 'no_device';
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          errorMessage = 'Microphone is being used by another application.';
          errorCode = 'device_in_use';
          break;
        case 'OverconstrainedError':
        case 'ConstraintNotSatisfiedError':
          errorMessage = 'Microphone does not meet requirements.';
          errorCode = 'constraint_error';
          break;
        case 'NotSupportedError':
          errorMessage = 'Microphone access not supported in this browser.';
          errorCode = 'not_supported';
          break;
        case 'TypeError':
          errorMessage = 'Invalid microphone configuration.';
          errorCode = 'invalid_config';
          break;
        default:
          errorMessage = `Microphone error: ${error.message}`;
          break;
      }
      
      return { 
        success: false, 
        granted: false, 
        error: errorMessage,
        errorCode: errorCode,
        originalError: error.name
      };
    }
  }

  // 获取麦克风权限状态
  async getMicrophonePermissionStatus() {
    const checkResult = await this.checkMicrophonePermission();
    
    if (!checkResult.success) {
      return checkResult;
    }
    
    return {
      success: true,
      hasPermission: checkResult.status === 'granted',
      status: checkResult.status,
      needsRequest: checkResult.needsRequest || false
    };
  }
}

// 创建单例实例
const twilioService = new TwilioService();

export default twilioService; 