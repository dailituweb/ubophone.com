/**
 * 基础服务类
 * 提供通用的服务功能和错误处理
 */

export class BaseService {
  constructor(name) {
    this.name = name;
    this.isInitialized = false;
    this.listeners = new Map();
    this.errorHandlers = new Map();
  }

  // 事件监听器管理
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // 返回取消监听的函数
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  // 移除事件监听器
  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // 触发事件
  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${this.name} event listener for ${event}:`, error);
        }
      });
    }
  }

  // 移除所有监听器
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  // 错误处理器管理
  addErrorHandler(errorType, handler) {
    if (!this.errorHandlers.has(errorType)) {
      this.errorHandlers.set(errorType, new Set());
    }
    this.errorHandlers.get(errorType).add(handler);
  }

  // 处理错误
  handleError(error, context = {}) {
    const errorType = this.getErrorType(error);
    const errorData = {
      error,
      context,
      service: this.name,
      timestamp: new Date().toISOString()
    };

    // 触发通用错误事件
    this.emit('error', errorData);

    // 调用特定错误处理器
    const handlers = this.errorHandlers.get(errorType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(errorData);
        } catch (handlerError) {
          console.error(`Error in ${this.name} error handler:`, handlerError);
        }
      });
    }

    // 记录错误
    this.logError(errorData);
  }

  // 获取错误类型
  getErrorType(error) {
    if (error.code) {
      return `code_${error.code}`;
    }
    if (error.name) {
      return error.name;
    }
    return 'unknown';
  }

  // 记录错误
  logError(errorData) {
    console.error(`[${this.name}] Error:`, errorData);
    
    // 可以在这里添加错误上报逻辑
    if (process.env.NODE_ENV === 'production') {
      // 发送到错误监控服务
      this.reportError(errorData);
    }
  }

  // 错误上报（可以被子类重写）
  reportError(errorData) {
    // 默认实现：存储到本地
    try {
      const errors = JSON.parse(localStorage.getItem('service-errors') || '[]');
      errors.push(errorData);
      
      // 只保留最近100个错误
      if (errors.length > 100) {
        errors.splice(0, errors.length - 100);
      }
      
      localStorage.setItem('service-errors', JSON.stringify(errors));
    } catch (e) {
      console.warn('Failed to store error:', e);
    }
  }

  // 异步操作包装器
  async safeExecute(operation, context = {}) {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
      throw error;
    }
  }

  // 重试机制
  async retry(operation, options = {}) {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 2,
      shouldRetry = () => true
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
          throw error;
        }
        
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        console.warn(`${this.name} operation failed (attempt ${attempt}/${maxAttempts}), retrying in ${waitTime}ms:`, error.message);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError;
  }

  // 超时包装器
  async withTimeout(operation, timeoutMs = 10000) {
    return Promise.race([
      operation(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${this.name} operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  // 状态管理
  setState(newState) {
    const oldState = this.state;
    this.state = { ...this.state, ...newState };
    this.emit('stateChange', { oldState, newState: this.state });
  }

  getState() {
    return { ...this.state };
  }

  // 初始化检查
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error(`${this.name} service is not initialized`);
    }
  }

  // 清理资源
  destroy() {
    this.removeAllListeners();
    this.errorHandlers.clear();
    this.isInitialized = false;
    this.emit('destroyed');
  }

  // 健康检查
  healthCheck() {
    return {
      service: this.name,
      initialized: this.isInitialized,
      listeners: this.listeners.size,
      errorHandlers: this.errorHandlers.size,
      timestamp: new Date().toISOString()
    };
  }
}

export default BaseService;
