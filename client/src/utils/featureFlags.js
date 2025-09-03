/**
 * 功能开关管理
 * 用于安全地部署优化后的组件
 */

class FeatureFlags {
  constructor() {
    this.flags = this.loadFlags();
    this.listeners = [];
  }

  // 加载功能开关配置
  loadFlags() {
    const defaultFlags = {
      useOptimizedPhonePage: false,
      useOptimizedDialer: false,
      useOptimizedHomePage: false,
      enablePerformanceMonitoring: true,
      enableErrorReporting: true,
      autoFallback: true
    };

    // 从环境变量加载
    const envFlags = {
      useOptimizedPhonePage: process.env.REACT_APP_USE_OPTIMIZED_PHONE === 'true',
      useOptimizedDialer: process.env.REACT_APP_USE_OPTIMIZED_DIALER === 'true',
      useOptimizedHomePage: process.env.REACT_APP_USE_OPTIMIZED_HOME === 'true'
    };

    // 从localStorage加载用户偏好
    const userFlags = {};
    try {
      const stored = localStorage.getItem('feature-flags');
      if (stored) {
        Object.assign(userFlags, JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load user feature flags:', error);
    }

    // 合并配置（优先级：用户 > 环境变量 > 默认）
    return { ...defaultFlags, ...envFlags, ...userFlags };
  }

  // 获取功能开关状态
  isEnabled(flagName) {
    return this.flags[flagName] === true;
  }

  // 设置功能开关
  setFlag(flagName, value) {
    this.flags[flagName] = value;
    this.saveFlags();
    this.notifyListeners(flagName, value);
  }

  // 批量设置功能开关
  setFlags(flags) {
    Object.assign(this.flags, flags);
    this.saveFlags();
    Object.entries(flags).forEach(([name, value]) => {
      this.notifyListeners(name, value);
    });
  }

  // 保存到localStorage
  saveFlags() {
    try {
      localStorage.setItem('feature-flags', JSON.stringify(this.flags));
    } catch (error) {
      console.warn('Failed to save feature flags:', error);
    }
  }

  // 添加监听器
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 通知监听器
  notifyListeners(flagName, value) {
    this.listeners.forEach(callback => {
      try {
        callback(flagName, value);
      } catch (error) {
        console.error('Feature flag listener error:', error);
      }
    });
  }

  // 获取所有开关状态
  getAllFlags() {
    return { ...this.flags };
  }

  // 重置为默认值
  reset() {
    this.flags = this.loadFlags();
    this.saveFlags();
  }

  // 错误回退机制
  handleComponentError(componentName, error) {
    if (!this.isEnabled('autoFallback')) return false;

    console.error(`Component ${componentName} failed:`, error);

    // 自动禁用有问题的组件
    const flagMap = {
      'OptimizedPhonePage': 'useOptimizedPhonePage',
      'OptimizedDialer': 'useOptimizedDialer',
      'OptimizedHomePage': 'useOptimizedHomePage'
    };

    const flagName = flagMap[componentName];
    if (flagName) {
      this.setFlag(flagName, false);
      
      // 记录错误
      this.recordError(componentName, error);
      
      // 通知用户
      if (window.toast) {
        window.toast.warn(`Switched to legacy ${componentName} due to error`);
      }
      
      return true;
    }

    return false;
  }

  // 记录错误
  recordError(componentName, error) {
    const errorLog = {
      component: componentName,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    try {
      const errors = JSON.parse(localStorage.getItem('component-errors') || '[]');
      errors.push(errorLog);
      
      // 只保留最近50个错误
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('component-errors', JSON.stringify(errors));
    } catch (e) {
      console.error('Failed to record error:', e);
    }
  }

  // 获取错误日志
  getErrorLog() {
    try {
      return JSON.parse(localStorage.getItem('component-errors') || '[]');
    } catch (error) {
      return [];
    }
  }

  // 清理错误日志
  clearErrorLog() {
    localStorage.removeItem('component-errors');
  }

  // A/B测试支持
  getVariant(testName, variants = ['A', 'B']) {
    const userId = this.getUserId();
    const hash = this.simpleHash(userId + testName);
    const variantIndex = hash % variants.length;
    return variants[variantIndex];
  }

  // 获取用户ID（用于A/B测试）
  getUserId() {
    let userId = localStorage.getItem('user-id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user-id', userId);
    }
    return userId;
  }

  // 简单哈希函数
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }
}

// 创建全局实例
const featureFlags = new FeatureFlags();

// React Hook
export const useFeatureFlag = (flagName) => {
  const [isEnabled, setIsEnabled] = React.useState(featureFlags.isEnabled(flagName));

  React.useEffect(() => {
    const unsubscribe = featureFlags.addListener((name, value) => {
      if (name === flagName) {
        setIsEnabled(value);
      }
    });

    return unsubscribe;
  }, [flagName]);

  return isEnabled;
};

// 组件选择器HOC
export const withFeatureFlag = (flagName, OptimizedComponent, LegacyComponent) => {
  return function FeatureFlaggedComponent(props) {
    const isEnabled = useFeatureFlag(flagName);
    
    if (isEnabled) {
      return (
        <ErrorBoundary
          fallback={<LegacyComponent {...props} />}
          onError={(error) => featureFlags.handleComponentError(OptimizedComponent.name, error)}
        >
          <OptimizedComponent {...props} />
        </ErrorBoundary>
      );
    }
    
    return <LegacyComponent {...props} />;
  };
};

// 错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}

export default featureFlags;
