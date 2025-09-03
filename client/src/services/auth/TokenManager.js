import { BaseService } from '../core/BaseService.js';

/**
 * Token管理服务
 * 处理Twilio访问令牌的验证、刷新和管理
 */
export class TokenManager extends BaseService {
  constructor() {
    super('TokenManager');
    this.token = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.state = {
      hasToken: false,
      isValid: false,
      expiresAt: null,
      needsRefresh: false
    };
  }

  // 设置Token
  setToken(token) {
    this.token = token;
    const validation = this.validateToken(token, true);
    
    this.setState({
      hasToken: !!token,
      isValid: validation.valid,
      expiresAt: validation.expiresAt,
      needsRefresh: validation.needsRefresh
    });

    this.emit('tokenSet', { token, validation });
    return validation;
  }

  // 获取当前Token
  getToken() {
    return this.token;
  }

  // 验证Token
  validateToken(token, returnDetailedResult = false) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token format');
      }

      // 检查是否是演示Token
      if (token.startsWith('demo_token_')) {
        if (returnDetailedResult) {
          return {
            valid: false,
            isDemo: true,
            error: 'Demo token - real calling requires valid Twilio configuration'
          };
        }
        return false;
      }

      // 解析JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // 解码payload
      const payload = JSON.parse(atob(parts[1]));
      
      // 检查过期时间
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = payload.exp;
      const timeLeft = expiresAt - now;

      if (timeLeft <= 0) {
        throw new Error('Token已过期');
      }

      // 检查必要的声明
      if (!payload.grants || !payload.grants.voice) {
        throw new Error('Token缺少语音通话授权');
      }

      const voiceGrant = payload.grants.voice;
      if (!voiceGrant.outgoing?.application_sid) {
        throw new Error('Token缺少TwiML应用SID');
      }

      if (returnDetailedResult) {
        // 检查是否即将过期（10分钟内）
        const needsRefresh = timeLeft < 600; // 10分钟
        
        return {
          valid: true,
          expiresAt: new Date(expiresAt * 1000),
          timeLeft,
          needsRefresh,
          payload,
          voiceGrant
        };
      }

      return true;
    } catch (error) {
      if (returnDetailedResult) {
        return {
          valid: false,
          error: error.message
        };
      }
      return false;
    }
  }

  // 检查Token是否需要刷新
  async checkTokenExpiry() {
    try {
      if (!this.token) {
        return { needsRefresh: true, reason: 'No token available' };
      }

      const validation = this.validateToken(this.token, true);
      
      if (!validation.valid) {
        return {
          needsRefresh: true,
          reason: validation.error || 'Token validation failed'
        };
      }

      if (validation.needsRefresh) {
        return {
          needsRefresh: true,
          reason: `Token expires in ${Math.round(validation.timeLeft / 60)} minutes`
        };
      }

      return {
        needsRefresh: false,
        timeLeft: validation.timeLeft,
        expiresAt: validation.expiresAt
      };
    } catch (error) {
      this.handleError(error, { operation: 'checkTokenExpiry' });
      return {
        needsRefresh: true,
        reason: error.message
      };
    }
  }

  // 刷新Token
  async refreshToken() {
    // 防止并发刷新
    if (this.isRefreshing) {
      console.log('Token refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  // 执行Token刷新
  async _performTokenRefresh() {
    try {
      const userToken = localStorage.getItem('token');
      if (!userToken) {
        throw new Error('用户未登录，无法刷新Twilio token');
      }

      this.emit('refreshStarted');

      const response = await fetch('/api/twilio/token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('用户认证失败，请重新登录');
        }
        throw new Error(errorData.message || `HTTP ${response.status}: Token刷新失败`);
      }

      const tokenData = await response.json();
      
      if (!tokenData.success || !tokenData.token) {
        throw new Error('服务器返回无效的token数据');
      }

      // 验证新Token
      const validation = this.validateToken(tokenData.token, true);
      if (!validation.valid) {
        throw new Error('服务器返回的新token无效');
      }

      // 更新Token
      this.setToken(tokenData.token);
      
      this.emit('refreshSuccess', {
        token: tokenData.token,
        validation
      });

      console.log('✅ Token刷新成功');
      return {
        success: true,
        token: tokenData.token,
        validation
      };

    } catch (error) {
      this.handleError(error, { operation: 'refreshToken' });
      this.emit('refreshFailed', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 确保Token有效
  async ensureValidToken() {
    try {
      const expiryCheck = await this.checkTokenExpiry();
      
      if (expiryCheck.needsRefresh) {
        console.log('Token需要刷新:', expiryCheck.reason);
        
        const refreshResult = await this.refreshToken();
        if (!refreshResult.success) {
          throw new Error(`Token刷新失败: ${refreshResult.error}`);
        }
        
        return {
          success: true,
          refreshed: true,
          token: refreshResult.token
        };
      }

      return {
        success: true,
        refreshed: false,
        token: this.token
      };
    } catch (error) {
      this.handleError(error, { operation: 'ensureValidToken' });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 启动自动刷新
  startAutoRefresh(intervalMinutes = 5) {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    this.autoRefreshInterval = setInterval(async () => {
      try {
        const expiryCheck = await this.checkTokenExpiry();
        if (expiryCheck.needsRefresh) {
          console.log('Auto-refreshing token:', expiryCheck.reason);
          await this.refreshToken();
        }
      } catch (error) {
        console.warn('Auto-refresh failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    this.emit('autoRefreshStarted', { intervalMinutes });
  }

  // 停止自动刷新
  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
      this.emit('autoRefreshStopped');
    }
  }

  // 获取Token信息
  getTokenInfo() {
    if (!this.token) {
      return { hasToken: false };
    }

    const validation = this.validateToken(this.token, true);
    return {
      hasToken: true,
      ...validation,
      token: this.token.substring(0, 20) + '...' // 只显示前20个字符
    };
  }

  // 清除Token
  clearToken() {
    this.token = null;
    this.setState({
      hasToken: false,
      isValid: false,
      expiresAt: null,
      needsRefresh: false
    });
    this.emit('tokenCleared');
  }

  // 获取状态
  getStatus() {
    return {
      ...this.getState(),
      isRefreshing: this.isRefreshing,
      autoRefreshActive: !!this.autoRefreshInterval
    };
  }

  // 清理资源
  destroy() {
    this.stopAutoRefresh();
    this.clearToken();
    super.destroy();
  }
}

export default TokenManager;
