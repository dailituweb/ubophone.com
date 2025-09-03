/**
 * 前端性能监控工具
 * 监控页面加载时间、组件渲染性能、内存使用等
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: {},
      componentRender: {},
      userInteraction: {},
      memory: {},
      network: {}
    };
    
    this.observers = [];
    this.isEnabled = process.env.NODE_ENV === 'development';
    
    if (this.isEnabled) {
      this.init();
    }
  }

  init() {
    this.setupNavigationObserver();
    this.setupResourceObserver();
    this.setupLongTaskObserver();
    this.setupMemoryMonitoring();
    this.setupUserInteractionTracking();
  }

  // 监控页面导航性能
  setupNavigationObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.metrics.pageLoad = {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              firstPaint: 0,
              firstContentfulPaint: 0,
              largestContentfulPaint: 0,
              timeToInteractive: entry.domInteractive - entry.fetchStart,
              totalLoadTime: entry.loadEventEnd - entry.fetchStart
            };
            
            console.log('📊 Page Load Metrics:', this.metrics.pageLoad);
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    }
  }

  // 监控资源加载性能
  setupResourceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceType = entry.initiatorType;
            const loadTime = entry.responseEnd - entry.startTime;
            
            if (!this.metrics.network[resourceType]) {
              this.metrics.network[resourceType] = [];
            }
            
            this.metrics.network[resourceType].push({
              name: entry.name,
              loadTime,
              size: entry.transferSize || 0,
              cached: entry.transferSize === 0 && entry.decodedBodySize > 0
            });
            
            // 警告慢加载资源
            if (loadTime > 1000) {
              console.warn(`🐌 Slow resource loading: ${entry.name} (${loadTime.toFixed(2)}ms)`);
            }
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  // 监控长任务
  setupLongTaskObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
            
            if (!this.metrics.userInteraction.longTasks) {
              this.metrics.userInteraction.longTasks = [];
            }
            
            this.metrics.userInteraction.longTasks.push({
              duration: entry.duration,
              startTime: entry.startTime,
              attribution: entry.attribution
            });
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.push(observer);
      } catch (e) {
        // longtask 可能不被支持
      }
    }
  }

  // 监控内存使用
  setupMemoryMonitoring() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = performance.memory;
        this.metrics.memory = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100).toFixed(2)
        };
        
        // 警告高内存使用
        if (this.metrics.memory.usagePercentage > 80) {
          console.warn(`🚨 High memory usage: ${this.metrics.memory.usagePercentage}%`);
        }
      };
      
      // 每30秒检查一次内存
      setInterval(checkMemory, 30000);
      checkMemory(); // 立即检查一次
    }
  }

  // 监控用户交互性能
  setupUserInteractionTracking() {
    const trackInteraction = (eventType) => {
      return (event) => {
        const startTime = performance.now();
        
        // 使用 requestIdleCallback 或 setTimeout 来测量交互响应时间
        const measureResponseTime = () => {
          const responseTime = performance.now() - startTime;
          
          if (!this.metrics.userInteraction[eventType]) {
            this.metrics.userInteraction[eventType] = [];
          }
          
          this.metrics.userInteraction[eventType].push({
            responseTime,
            timestamp: Date.now(),
            target: event.target.tagName
          });
          
          // 警告慢响应
          if (responseTime > 100) {
            console.warn(`⚠️ Slow ${eventType} response: ${responseTime.toFixed(2)}ms`);
          }
        };
        
        if ('requestIdleCallback' in window) {
          requestIdleCallback(measureResponseTime);
        } else {
          setTimeout(measureResponseTime, 0);
        }
      };
    };
    
    // 监控关键交互事件
    ['click', 'input', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, trackInteraction(eventType), { passive: true });
    });
  }

  // 测量组件渲染时间
  measureComponentRender(componentName, renderFunction) {
    if (!this.isEnabled) return renderFunction();
    
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (!this.metrics.componentRender[componentName]) {
      this.metrics.componentRender[componentName] = [];
    }
    
    this.metrics.componentRender[componentName].push({
      renderTime,
      timestamp: Date.now()
    });
    
    // 警告慢渲染
    if (renderTime > 16) { // 超过一帧的时间
      console.warn(`🐌 Slow component render: ${componentName} (${renderTime.toFixed(2)}ms)`);
    }
    
    return result;
  }

  // 获取性能报告
  getPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  // 生成性能优化建议
  generateRecommendations() {
    const recommendations = [];
    
    // 检查页面加载时间
    if (this.metrics.pageLoad.totalLoadTime > 3000) {
      recommendations.push({
        type: 'page_load',
        message: '页面加载时间过长，建议优化资源加载',
        priority: 'high'
      });
    }
    
    // 检查长任务
    if (this.metrics.userInteraction.longTasks?.length > 0) {
      recommendations.push({
        type: 'long_tasks',
        message: '检测到长任务，可能影响用户交互响应',
        priority: 'medium'
      });
    }
    
    // 检查内存使用
    if (this.metrics.memory.usagePercentage > 70) {
      recommendations.push({
        type: 'memory',
        message: '内存使用率较高，建议检查内存泄漏',
        priority: 'medium'
      });
    }
    
    // 检查慢资源
    Object.entries(this.metrics.network).forEach(([type, resources]) => {
      const slowResources = resources.filter(r => r.loadTime > 1000);
      if (slowResources.length > 0) {
        recommendations.push({
          type: 'slow_resources',
          message: `${type} 资源加载较慢，建议优化`,
          priority: 'medium'
        });
      }
    });
    
    return recommendations;
  }

  // 清理观察者
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // 导出性能数据
  exportMetrics() {
    const data = JSON.stringify(this.getPerformanceReport(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor();

// React Hook for component performance monitoring
export const usePerformanceMonitor = (componentName) => {
  const measureRender = (renderFunction) => {
    return performanceMonitor.measureComponentRender(componentName, renderFunction);
  };
  
  return { measureRender };
};

// HOC for automatic component performance monitoring
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return function PerformanceMonitoredComponent(props) {
    const { measureRender } = usePerformanceMonitor(componentName || WrappedComponent.name);
    
    return measureRender(() => <WrappedComponent {...props} />);
  };
};

export default performanceMonitor;
