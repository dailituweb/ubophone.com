const fs = require('fs').promises;
const path = require('path');

/**
 * 通用的 Webhook 日志中间件
 * 记录请求详情、响应时间、错误信息等
 */
class WebhookLogger {
  constructor(options = {}) {
    this.options = {
      logDir: path.join(__dirname, '../../logs'),
      logToFile: options.logToFile !== false,
      logToConsole: options.logToConsole !== false,
      sensitiveFields: ['password', 'token', 'authToken', 'apiKey'],
      ...options
    };
    
    if (this.options.logToFile) {
      this.ensureLogDir();
    }
  }

  async ensureLogDir() {
    try {
      await fs.mkdir(this.options.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  // 主日志中间件
  middleware() {
    return async (req, res, next) => {
      const requestId = this.generateRequestId();
      const startTime = Date.now();
      
      // 附加到请求对象
      req.requestId = requestId;
      req.startTime = startTime;

      // 记录请求
      await this.logRequest(req);

      // 拦截响应
      this.interceptResponse(req, res);

      next();
    };
  }

  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 清理敏感数据
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    
    this.options.sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  async logRequest(req) {
    const logEntry = {
      id: req.requestId,
      timestamp: new Date().toISOString(),
      type: 'REQUEST',
      method: req.method,
      path: req.path,
      url: req.url,
      query: this.sanitizeData(req.query),
      headers: {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'x-twilio-signature': req.headers['x-twilio-signature'] ? '✓ Present' : '✗ Missing',
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-forwarded-proto': req.headers['x-forwarded-proto'],
        'user-agent': req.headers['user-agent']
      },
      body: this.sanitizeData(req.body),
      ip: req.ip || req.connection.remoteAddress,
      // Twilio 特定字段
      twilio: {
        callSid: req.body?.CallSid || req.query?.CallSid,
        accountSid: req.body?.AccountSid,
        from: req.body?.From,
        to: req.body?.To,
        callStatus: req.body?.CallStatus
      }
    };

    // 控制台输出
    if (this.options.logToConsole) {
      console.log(`\n📨 [${req.requestId}] Webhook Request:`);
      console.log(`   Method: ${logEntry.method} ${logEntry.path}`);
      console.log(`   Twilio Signature: ${logEntry.headers['x-twilio-signature']}`);
      
      if (logEntry.twilio.callSid) {
        console.log(`   Call SID: ${logEntry.twilio.callSid}`);
        console.log(`   From: ${logEntry.twilio.from} → To: ${logEntry.twilio.to}`);
      }
      
      if (Object.keys(req.body || {}).length > 0) {
        console.log('   Body:', JSON.stringify(this.sanitizeData(req.body), null, 2));
      }
    }

    // 文件记录
    if (this.options.logToFile) {
      await this.writeToFile(logEntry);
    }
  }

  interceptResponse(req, res) {
    const originalSend = res.send;
    const originalJson = res.json;
    const self = this;

    // 拦截 send
    res.send = function(data) {
      res.responseBody = data;
      self.logResponse(req, res).catch(console.error);
      originalSend.call(this, data);
    };

    // 拦截 json
    res.json = function(data) {
      res.responseBody = JSON.stringify(data);
      self.logResponse(req, res).catch(console.error);
      originalJson.call(this, data);
    };
  }

  async logResponse(req, res) {
    const responseTime = Date.now() - req.startTime;
    
    const logEntry = {
      id: req.requestId,
      timestamp: new Date().toISOString(),
      type: 'RESPONSE',
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      responseTime: responseTime,
      headers: res.getHeaders(),
      // 只记录错误响应的body
      body: res.statusCode >= 400 ? res.responseBody : undefined,
      performance: {
        slow: responseTime > 5000,
        timeout: responseTime > 14000,
        category: this.getPerformanceCategory(responseTime)
      }
    };

    // 控制台输出
    if (this.options.logToConsole) {
      const emoji = res.statusCode < 400 ? '✅' : '❌';
      const timeColor = responseTime > 5000 ? '\x1b[31m' : (responseTime > 1000 ? '\x1b[33m' : '\x1b[32m');
      
      console.log(`${emoji} [${req.requestId}] Response: ${res.statusCode} in ${timeColor}${responseTime}ms\x1b[0m`);
      
      // 性能警告
      if (responseTime > 5000) {
        console.warn(`⚠️  [${req.requestId}] Slow response detected!`);
      }
      
      if (responseTime > 14000) {
        console.error(`🚨 [${req.requestId}] Response may timeout on Twilio (>14s)!`);
      }
    }

    // 文件记录
    if (this.options.logToFile) {
      await this.writeToFile(logEntry);
    }
  }

  getPerformanceCategory(responseTime) {
    if (responseTime < 100) return 'excellent';
    if (responseTime < 500) return 'good';
    if (responseTime < 1000) return 'fair';
    if (responseTime < 5000) return 'slow';
    return 'critical';
  }

  async writeToFile(logEntry) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.options.logDir, `webhook-${date}.log`);
      
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(logFile, logLine);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  // 日志分析工具
  async analyzeLogs(date) {
    try {
      const logFile = path.join(this.options.logDir, `webhook-${date}.log`);
      const content = await fs.readFile(logFile, 'utf8');
      const logs = content.split('\n').filter(line => line).map(line => JSON.parse(line));
      
      const analysis = {
        totalRequests: logs.filter(l => l.type === 'REQUEST').length,
        totalResponses: logs.filter(l => l.type === 'RESPONSE').length,
        avgResponseTime: 0,
        slowRequests: [],
        errors: [],
        byPath: {},
        byStatus: {}
      };

      const responses = logs.filter(l => l.type === 'RESPONSE');
      
      // 计算平均响应时间
      if (responses.length > 0) {
        const totalTime = responses.reduce((sum, r) => sum + r.responseTime, 0);
        analysis.avgResponseTime = Math.round(totalTime / responses.length);
      }

      // 分析慢请求和错误
      responses.forEach(response => {
        if (response.responseTime > 5000) {
          analysis.slowRequests.push({
            id: response.id,
            time: response.responseTime,
            timestamp: response.timestamp
          });
        }

        if (response.statusCode >= 400) {
          analysis.errors.push({
            id: response.id,
            status: response.statusCode,
            timestamp: response.timestamp
          });
        }

        // 按状态码统计
        analysis.byStatus[response.statusCode] = (analysis.byStatus[response.statusCode] || 0) + 1;
      });

      // 按路径统计
      logs.filter(l => l.type === 'REQUEST').forEach(request => {
        analysis.byPath[request.path] = (analysis.byPath[request.path] || 0) + 1;
      });

      return analysis;
    } catch (error) {
      console.error('Failed to analyze logs:', error);
      return null;
    }
  }
}

// 导出实例
module.exports = new WebhookLogger();

// 也导出类，以便自定义配置
module.exports.WebhookLogger = WebhookLogger;