import React, { memo, useMemo, useCallback, useRef } from 'react';

/**
 * 高级记忆化工具
 * 提供更精细的组件和函数记忆化控制
 */

/**
 * 深度比较函数
 * 用于 React.memo 的自定义比较
 */
export const deepEqual = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  
  for (const key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      // 对于对象和数组进行深度比较
      if (typeof prevProps[key] === 'object' && typeof nextProps[key] === 'object') {
        if (JSON.stringify(prevProps[key]) !== JSON.stringify(nextProps[key])) {
          return false;
        }
      } else {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * 浅比较函数
 * 只比较第一层属性
 */
export const shallowEqual = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  
  for (const key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }
  
  return true;
};

/**
 * 创建优化的记忆化组件
 * @param {React.Component} Component - 要记忆化的组件
 * @param {Object} options - 配置选项
 * @returns {React.Component} 记忆化的组件
 */
export const createMemoizedComponent = (Component, options = {}) => {
  const {
    compareProps = shallowEqual,
    displayName,
    debugMode = false
  } = options;
  
  const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
    const areEqual = compareProps(prevProps, nextProps);
    
    if (debugMode) {
      console.log(`🔍 Memo check for ${displayName || Component.name}:`, {
        areEqual,
        prevProps,
        nextProps
      });
    }
    
    return areEqual;
  });
  
  MemoizedComponent.displayName = displayName || `Memoized(${Component.displayName || Component.name})`;
  
  return MemoizedComponent;
};

/**
 * 稳定的回调函数 Hook
 * 避免不必要的重新渲染
 */
export const useStableCallback = (callback, deps = []) => {
  const callbackRef = useRef(callback);
  
  // 更新回调引用
  callbackRef.current = callback;
  
  // 返回稳定的回调函数
  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, deps);
};

/**
 * 记忆化计算 Hook
 * 带有依赖项比较优化
 */
export const useOptimizedMemo = (factory, deps, compareFunction = shallowEqual) => {
  const prevDepsRef = useRef();
  const memoizedValueRef = useRef();
  
  // 如果依赖项没有变化，返回缓存的值
  if (prevDepsRef.current && compareFunction(prevDepsRef.current, deps)) {
    return memoizedValueRef.current;
  }
  
  // 计算新值
  const newValue = factory();
  
  // 更新缓存
  prevDepsRef.current = deps;
  memoizedValueRef.current = newValue;
  
  return newValue;
};

/**
 * 防抖 Hook
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

/**
 * 节流 Hook
 */
export const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = React.useState(value);
  const lastRan = useRef(Date.now());
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);
  
  return throttledValue;
};

/**
 * 记忆化选择器 Hook
 * 用于从复杂状态中选择特定数据
 */
export const useMemoizedSelector = (selector, state, deps = []) => {
  return useMemo(() => selector(state), [state, ...deps]);
};

/**
 * 批量记忆化 Hook
 * 一次性记忆化多个值
 */
export const useBatchMemo = (factories) => {
  return useMemo(() => {
    const results = {};
    
    Object.entries(factories).forEach(([key, factory]) => {
      results[key] = factory();
    });
    
    return results;
  }, [factories]);
};

/**
 * 条件记忆化 Hook
 * 只在满足条件时才重新计算
 */
export const useConditionalMemo = (factory, condition, deps = []) => {
  const cachedValueRef = useRef();
  const prevConditionRef = useRef();
  
  return useMemo(() => {
    if (condition && condition !== prevConditionRef.current) {
      cachedValueRef.current = factory();
      prevConditionRef.current = condition;
    }
    
    return cachedValueRef.current;
  }, [condition, ...deps]);
};

/**
 * 组件性能分析器
 */
export const withPerformanceProfiler = (Component, componentName) => {
  return memo((props) => {
    const renderStartTime = useRef();
    const renderCount = useRef(0);
    
    // 渲染开始
    renderStartTime.current = performance.now();
    renderCount.current += 1;
    
    React.useEffect(() => {
      // 渲染结束
      const renderTime = performance.now() - renderStartTime.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 ${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
        
        // 警告慢渲染
        if (renderTime > 16) {
          console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      }
    });
    
    return <Component {...props} />;
  });
};

/**
 * 智能记忆化 HOC
 * 自动选择最佳的记忆化策略
 */
export const withSmartMemo = (Component, options = {}) => {
  const {
    propTypes,
    heavyProps = [],
    lightProps = [],
    debugMode = false
  } = options;
  
  // 根据 props 类型选择比较策略
  const compareStrategy = (prevProps, nextProps) => {
    // 对于重型 props 使用深度比较
    for (const prop of heavyProps) {
      if (prevProps[prop] !== nextProps[prop]) {
        if (typeof prevProps[prop] === 'object') {
          if (JSON.stringify(prevProps[prop]) !== JSON.stringify(nextProps[prop])) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    
    // 对于轻型 props 使用浅比较
    for (const prop of lightProps) {
      if (prevProps[prop] !== nextProps[prop]) {
        return false;
      }
    }
    
    // 默认浅比较其他 props
    return shallowEqual(prevProps, nextProps);
  };
  
  return createMemoizedComponent(Component, {
    compareProps: compareStrategy,
    debugMode,
    displayName: `SmartMemo(${Component.displayName || Component.name})`
  });
};

export default {
  createMemoizedComponent,
  useStableCallback,
  useOptimizedMemo,
  useDebounce,
  useThrottle,
  useMemoizedSelector,
  useBatchMemo,
  useConditionalMemo,
  withPerformanceProfiler,
  withSmartMemo,
  deepEqual,
  shallowEqual
};
