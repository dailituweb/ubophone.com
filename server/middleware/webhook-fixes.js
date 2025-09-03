/**
 * Webhook 常见问题修复中间件集合
 */

// 1. 修复尾部斜杠导致的 301 重定向
const fixTrailingSlash = (req, res, next) => {
  // Twilio 可能发送带尾部斜杠的请求
  // Express 默认会 301 重定向，导致 POST 变成 GET
  
  if (req.path.endsWith('/') && req.path.length > 1) {
    // 移除尾部斜杠并内部重定向
    req.url = req.url.slice(0, -1);
    console.log(`🔧 Fixed trailing slash: ${req.path} → ${req.url}`);
  }
  next();
};

// 2. 修复 HTTP→HTTPS 重定向问题
const fixProtocolRedirect = (req, res, next) => {
  // 检测反向代理的协议
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  
  // 在生产环境强制 HTTPS
  if (process.env.NODE_ENV === 'production' && protocol === 'http') {
    // 对于 Webhook，不要重定向，而是记录警告
    if (req.path.includes('/webhook/')) {
      console.warn(`⚠️  HTTP request to webhook: ${req.path}`);
      console.warn('   Twilio should use HTTPS URLs');
      // 继续处理，不重定向
      next();
    } else {
      // 其他请求重定向到 HTTPS
      const httpsUrl = `https://${req.headers.host}${req.url}`;
      return res.redirect(301, httpsUrl);
    }
  } else {
    next();
  }
};

// 3. 修复反向代理 URL 问题
const fixProxyUrl = (req, res, next) => {
  // 记录原始信息用于调试
  if (req.headers['x-forwarded-host'] || req.headers['x-forwarded-proto']) {
    console.log('🔍 Proxy headers detected:');
    console.log(`   Original Host: ${req.headers.host}`);
    console.log(`   Forwarded Host: ${req.headers['x-forwarded-host']}`);
    console.log(`   Forwarded Proto: ${req.headers['x-forwarded-proto']}`);
    console.log(`   Forwarded For: ${req.headers['x-forwarded-for']}`);
  }
  
  // 修正请求的协议和主机
  if (req.headers['x-forwarded-host']) {
    req.headers.host = req.headers['x-forwarded-host'];
  }
  
  next();
};

// 4. 防止负载均衡器健康检查污染日志
const filterHealthChecks = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // 常见的健康检查 User-Agent
  const healthCheckAgents = [
    'ELB-HealthChecker',
    'kube-probe',
    'GoogleHC',
    'Pingdom',
    'UptimeRobot',
    'Datadog'
  ];
  
  const isHealthCheck = 
    req.path === '/health' ||
    req.path === '/healthz' ||
    healthCheckAgents.some(agent => userAgent.includes(agent));
  
  if (isHealthCheck) {
    // 标记为健康检查，后续中间件可以跳过日志
    req.isHealthCheck = true;
    
    // 快速响应健康检查
    if (req.path === '/health' || req.path === '/healthz') {
      return res.status(200).send('OK');
    }
  }
  
  next();
};

// 5. Twilio 签名验证（可选）
const validateTwilioSignature = (options = {}) => {
  const { authToken, skipPaths = [], enforceHttps = true } = options;
  
  return (req, res, next) => {
    // 跳过某些路径
    if (skipPaths.some(path => req.path.includes(path))) {
      return next();
    }
    
    // 检查签名头
    const signature = req.headers['x-twilio-signature'];
    
    if (!signature) {
      console.warn(`⚠️  Missing Twilio signature for: ${req.path}`);
      // 在开发环境可以继续，生产环境应该拒绝
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).send('Unauthorized');
      }
    }
    
    // TODO: 实际的签名验证逻辑
    // const twilio = require('twilio');
    // const isValid = twilio.validateRequest(authToken, signature, url, params);
    
    next();
  };
};

// 6. 超时保护
const timeoutProtection = (timeout = 14000) => {
  return (req, res, next) => {
    // 设置超时计时器
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`🚨 Request timeout: ${req.path}`);
        
        // 对 Webhook 返回简单的 TwiML
        if (req.path.includes('/webhook/')) {
          res.status(504).set('Content-Type', 'text/xml').send(
            '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Service temporarily unavailable</Say></Response>'
          );
        } else {
          res.status(504).json({ error: 'Gateway Timeout' });
        }
      }
    }, timeout);
    
    // 清理计时器
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    
    next();
  };
};

// 7. 请求体大小限制（防止攻击）
const bodySizeLimit = (req, res, next) => {
  // Twilio webhook 的请求体通常很小
  const contentLength = parseInt(req.headers['content-length'] || '0');
  
  if (contentLength > 10240) { // 10KB 限制
    console.error(`❌ Request body too large: ${contentLength} bytes`);
    return res.status(413).send('Payload Too Large');
  }
  
  next();
};

// 8. 组合所有修复为一个中间件
const webhookFixes = () => {
  return (req, res, next) => {
    // 只对 webhook 路径应用修复
    if (!req.path.includes('/webhook/') && !req.path.includes('/api/')) {
      return next();
    }
    
    // 按顺序应用所有修复
    const fixes = [
      fixTrailingSlash,
      fixProtocolRedirect,
      fixProxyUrl,
      filterHealthChecks,
      bodySizeLimit,
      timeoutProtection(14000)
    ];
    
    // 链式调用所有修复
    let index = 0;
    const runNext = () => {
      if (index >= fixes.length) {
        return next();
      }
      const fix = fixes[index++];
      fix(req, res, runNext);
    };
    
    runNext();
  };
};

module.exports = {
  fixTrailingSlash,
  fixProtocolRedirect,
  fixProxyUrl,
  filterHealthChecks,
  validateTwilioSignature,
  timeoutProtection,
  bodySizeLimit,
  webhookFixes
};