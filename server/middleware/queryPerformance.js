const { sequelize } = require('../models');

/**
 * 查询性能监控中间件
 * 监控慢查询并记录性能指标
 */

class QueryPerformanceMonitor {
  constructor() {
    this.slowQueries = [];
    this.queryStats = {
      total: 0,
      slow: 0,
      avgDuration: 0,
      maxDuration: 0
    };
    this.slowQueryThreshold = 1000; // 1秒
    this.maxSlowQueries = 100; // 最多保存100个慢查询
    
    this.setupSequelizeHooks();
  }

  setupSequelizeHooks() {
    // 监控所有 Sequelize 查询
    sequelize.addHook('beforeQuery', (options) => {
      options.startTime = Date.now();
    });

    sequelize.addHook('afterQuery', (options, result) => {
      const duration = Date.now() - options.startTime;
      this.recordQuery(options.sql, duration, options);
    });
  }

  recordQuery(sql, duration, options = {}) {
    // 更新统计信息
    this.queryStats.total++;
    this.queryStats.avgDuration = 
      (this.queryStats.avgDuration * (this.queryStats.total - 1) + duration) / this.queryStats.total;
    
    if (duration > this.queryStats.maxDuration) {
      this.queryStats.maxDuration = duration;
    }

    // 记录慢查询
    if (duration > this.slowQueryThreshold) {
      this.queryStats.slow++;
      
      const slowQuery = {
        sql: this.sanitizeSql(sql),
        duration,
        timestamp: new Date().toISOString(),
        bind: options.bind ? JSON.stringify(options.bind).substring(0, 200) : null,
        type: options.type || 'unknown'
      };

      this.slowQueries.push(slowQuery);
      
      // 保持慢查询列表大小
      if (this.slowQueries.length > this.maxSlowQueries) {
        this.slowQueries.shift();
      }

      // 记录慢查询日志
      console.warn(`🐌 慢查询检测 (${duration}ms):`, {
        sql: slowQuery.sql.substring(0, 100) + '...',
        duration,
        type: slowQuery.type
      });
    }
  }

  sanitizeSql(sql) {
    // 移除敏感信息和格式化SQL
    return sql
      .replace(/\s+/g, ' ')
      .replace(/'/g, "'")
      .substring(0, 500); // 限制长度
  }

  getStats() {
    return {
      ...this.queryStats,
      slowQueryRate: this.queryStats.total > 0 ? 
        (this.queryStats.slow / this.queryStats.total * 100).toFixed(2) + '%' : '0%',
      recentSlowQueries: this.slowQueries.slice(-10) // 最近10个慢查询
    };
  }

  getSlowQueries(limit = 20) {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  reset() {
    this.slowQueries = [];
    this.queryStats = {
      total: 0,
      slow: 0,
      avgDuration: 0,
      maxDuration: 0
    };
  }
}

// 创建全局监控实例
const queryMonitor = new QueryPerformanceMonitor();

/**
 * Express 中间件：记录请求的数据库查询性能
 */
const queryPerformanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // 记录请求开始时的查询统计
  const startStats = { ...queryMonitor.queryStats };
  
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const endStats = { ...queryMonitor.queryStats };
    
    // 计算此请求的查询统计
    const requestQueries = endStats.total - startStats.total;
    const requestSlowQueries = endStats.slow - startStats.slow;
    
    // 如果有慢查询或查询数量过多，记录警告
    if (requestSlowQueries > 0 || requestQueries > 10) {
      console.warn(`⚠️ 请求性能警告 ${req.method} ${req.path}:`, {
        totalDuration: duration + 'ms',
        queries: requestQueries,
        slowQueries: requestSlowQueries,
        avgQueryTime: requestQueries > 0 ? 
          Math.round((endStats.avgDuration * endStats.total - startStats.avgDuration * startStats.total) / requestQueries) + 'ms' : '0ms'
      });
    }
    
    // 添加性能头信息（仅开发环境）
    if (process.env.NODE_ENV !== 'production') {
      res.set({
        'X-Query-Count': requestQueries.toString(),
        'X-Slow-Query-Count': requestSlowQueries.toString(),
        'X-Response-Time': duration + 'ms'
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * 获取查询性能报告
 */
const getPerformanceReport = () => {
  const stats = queryMonitor.getStats();
  const slowQueries = queryMonitor.getSlowQueries(10);
  const memoryUsage = process.memoryUsage();
  
  return {
    timestamp: new Date().toISOString(),
    queryStats: stats,
    slowQueries,
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
    },
    recommendations: generateRecommendations(stats, slowQueries)
  };
};

/**
 * 生成性能优化建议
 */
const generateRecommendations = (stats, slowQueries) => {
  const recommendations = [];
  
  if (stats.slow > 0) {
    recommendations.push({
      type: 'slow_queries',
      message: `检测到 ${stats.slow} 个慢查询，建议优化SQL或添加索引`,
      priority: 'high'
    });
  }
  
  if (stats.avgDuration > 100) {
    recommendations.push({
      type: 'avg_duration',
      message: `平均查询时间 ${Math.round(stats.avgDuration)}ms 较高，建议优化查询`,
      priority: 'medium'
    });
  }
  
  if (stats.total > 1000) {
    recommendations.push({
      type: 'query_count',
      message: `查询总数 ${stats.total} 较高，建议添加缓存或减少查询`,
      priority: 'medium'
    });
  }
  
  // 分析慢查询模式
  const sqlPatterns = {};
  slowQueries.forEach(query => {
    const pattern = query.sql.split(' ').slice(0, 3).join(' ');
    sqlPatterns[pattern] = (sqlPatterns[pattern] || 0) + 1;
  });
  
  Object.entries(sqlPatterns).forEach(([pattern, count]) => {
    if (count > 2) {
      recommendations.push({
        type: 'repeated_slow_query',
        message: `重复慢查询模式 "${pattern}" 出现 ${count} 次，建议优化`,
        priority: 'high'
      });
    }
  });
  
  return recommendations;
};

module.exports = {
  queryPerformanceMiddleware,
  getPerformanceReport,
  queryMonitor,
  QueryPerformanceMonitor
};
