import React, { Suspense } from 'react';
import styled, { keyframes } from 'styled-components';

/**
 * 优化的懒加载工具
 * 提供更好的加载体验和错误处理
 */

// 加载动画
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 1rem;
`;

const LoadingText = styled.p`
  color: #666;
  font-size: 14px;
  margin: 0;
`;

// 默认加载组件
const DefaultLoadingComponent = ({ message = "Loading..." }) => (
  <LoadingContainer>
    <Spinner />
    <LoadingText>{message}</LoadingText>
  </LoadingContainer>
);

// 错误边界组件
class LazyLoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <LoadingContainer>
          <div style={{ color: '#dc3545', textAlign: 'center' }}>
            <h3>⚠️ Loading Error</h3>
            <p>Failed to load component. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
        </LoadingContainer>
      );
    }

    return this.props.children;
  }
}

/**
 * 创建优化的懒加载组件
 * @param {Function} importFunc - 动态导入函数
 * @param {Object} options - 配置选项
 * @returns {React.Component} 懒加载组件
 */
export const createLazyComponent = (importFunc, options = {}) => {
  const {
    fallback = <DefaultLoadingComponent />,
    errorBoundary = true,
    preload = false,
    retryCount = 3
  } = options;

  // 创建带重试机制的导入函数
  const importWithRetry = async () => {
    let lastError;
    
    for (let i = 0; i < retryCount; i++) {
      try {
        const module = await importFunc();
        return module;
      } catch (error) {
        lastError = error;
        console.warn(`Lazy loading attempt ${i + 1} failed:`, error);
        
        // 如果不是最后一次尝试，等待一段时间后重试
        if (i < retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    
    throw lastError;
  };

  const LazyComponent = React.lazy(importWithRetry);

  // 预加载功能
  if (preload) {
    // 在空闲时间预加载组件
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importWithRetry().catch(() => {
          // 预加载失败不影响正常使用
        });
      });
    } else {
      // 降级到 setTimeout
      setTimeout(() => {
        importWithRetry().catch(() => {
          // 预加载失败不影响正常使用
        });
      }, 2000);
    }
  }

  const WrappedComponent = (props) => {
    const content = (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );

    return errorBoundary ? (
      <LazyLoadErrorBoundary>
        {content}
      </LazyLoadErrorBoundary>
    ) : content;
  };

  // 添加预加载方法
  WrappedComponent.preload = () => importWithRetry();

  return WrappedComponent;
};

/**
 * 路由级别的懒加载组件
 */
export const createLazyRoute = (importFunc, loadingMessage) => {
  return createLazyComponent(importFunc, {
    fallback: <DefaultLoadingComponent message={loadingMessage} />,
    errorBoundary: true,
    retryCount: 3
  });
};

/**
 * 组件级别的懒加载
 */
export const createLazyWidget = (importFunc, options = {}) => {
  return createLazyComponent(importFunc, {
    fallback: <DefaultLoadingComponent message="Loading widget..." />,
    errorBoundary: false, // 组件级别的错误不应该影响整个页面
    retryCount: 2,
    ...options
  });
};

/**
 * 预加载多个组件
 */
export const preloadComponents = (components) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      components.forEach(component => {
        if (component.preload) {
          component.preload().catch(() => {
            // 预加载失败不影响正常使用
          });
        }
      });
    });
  }
};

/**
 * 基于路由的智能预加载
 */
export const setupRoutePreloading = (routeMap) => {
  // 监听鼠标悬停在导航链接上的事件
  document.addEventListener('mouseover', (event) => {
    const link = event.target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href');
      const component = routeMap[href];
      
      if (component && component.preload) {
        component.preload().catch(() => {
          // 预加载失败不影响正常使用
        });
      }
    }
  });
};

const lazyLoadingUtils = {
  createLazyComponent,
  createLazyRoute,
  createLazyWidget,
  preloadComponents,
  setupRoutePreloading
};

export default lazyLoadingUtils;
