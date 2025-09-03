import React, { memo, Suspense } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { createLazyWidget } from '../utils/lazyLoading';
import { usePerformanceMonitor } from '../utils/performanceMonitor';

// 懒加载主页组件
const HeroSection = createLazyWidget(() => import('../components/HomePage/HeroSection'));
const FeaturesSection = createLazyWidget(() => import('../components/HomePage/FeaturesSection'));
const DialerSection = createLazyWidget(() => import('../components/HomePage/DialerSection'));

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.6;
    color: #333;
    overflow-x: hidden;
  }
  
  html {
    scroll-behavior: smooth;
  }
  
  /* 优化滚动性能 */
  * {
    -webkit-overflow-scrolling: touch;
  }
  
  /* 减少重绘 */
  img, video {
    will-change: transform;
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  position: relative;
`;

const LoadingSection = styled.div`
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorBoundary = styled.div`
  min-height: 50vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  color: #6c757d;
  text-align: center;
  padding: 2rem;
  
  h3 {
    margin-bottom: 1rem;
    color: #dc3545;
  }
  
  button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background: #0056b3;
    }
  }
`;

// 性能优化的加载组件
const OptimizedLoadingComponent = memo(({ message = "Loading..." }) => (
  <LoadingSection>
    <div>
      <div className="spinner"></div>
      <p style={{ marginTop: '1rem', color: '#666' }}>{message}</p>
    </div>
  </LoadingSection>
));

OptimizedLoadingComponent.displayName = 'OptimizedLoadingComponent';

// 错误处理组件
const ErrorFallback = memo(({ error, resetError }) => (
  <ErrorBoundary>
    <h3>⚠️ Something went wrong</h3>
    <p>We're sorry, but this section failed to load.</p>
    <details style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
      <summary>Error details</summary>
      <pre>{error?.message}</pre>
    </details>
    <button onClick={resetError}>Try again</button>
  </ErrorBoundary>
));

ErrorFallback.displayName = 'ErrorFallback';

// 主页组件
const OptimizedHomePage = memo(() => {
  const { measureRender } = usePerformanceMonitor('OptimizedHomePage');

  return measureRender(() => (
    <>
      <GlobalStyle />
      <PageContainer>
        {/* Hero Section */}
        <Suspense fallback={<OptimizedLoadingComponent message="Loading hero section..." />}>
          <HeroSection />
        </Suspense>

        {/* Features Section */}
        <Suspense fallback={<OptimizedLoadingComponent message="Loading features..." />}>
          <FeaturesSection />
        </Suspense>

        {/* Dialer Section */}
        <Suspense fallback={<OptimizedLoadingComponent message="Loading dialer..." />}>
          <DialerSection />
        </Suspense>
      </PageContainer>
    </>
  ));
});

OptimizedHomePage.displayName = 'OptimizedHomePage';

export default OptimizedHomePage;
