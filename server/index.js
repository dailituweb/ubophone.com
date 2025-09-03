const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const rateLimit = require('express-rate-limit');
const { sequelize, testConnection } = require('./config/database');
const { addForeignKeyConstraints, performDatabaseHealthCheck } = require('./models');
const passport = require('./config/passport');
const webSocketManager = require('./config/websocket');
const { queryPerformanceMiddleware, getPerformanceReport } = require('./middleware/queryPerformance');

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// 速率限制配置
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP 15分钟内最多5次登录尝试
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const callLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 10, // 限制每个IP 1分钟内最多10个通话请求
  message: {
    error: 'Too many call requests, please wait before trying again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());

// 安全头中间件
app.use((req, res, next) => {
  // 防止XSS攻击
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HSTS (仅在HTTPS下启用)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // 内容安全策略 - 为Twilio Voice SDK、Tailwind CSS和Google Fonts配置完整的域名
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
      "https://js.stripe.com " +
      "https://sdk.twilio.com " +
      "https://media.twiliocdn.com " +
      "https://cdn.tailwindcss.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' " +
      "https://api.stripe.com " +
      "https://sdk.twilio.com " +
      "https://eventgw.us1.twilio.com " +
      "https://eventgw.ie1.twilio.com " +
      "https://eventgw.ap1.twilio.com " +
      "https://media.twiliocdn.com " +
      "https://voice-js.s3.amazonaws.com " +
      "wss://chunder.twilio.com " +
      "wss://chunder.us1.twilio.com " +
      "wss://chunder.ie1.twilio.com " +
      "wss://chunder.ap1.twilio.com " +
      "wss: ws:; " +
    "media-src 'self' https://media.twiliocdn.com https://voice-js.s3.amazonaws.com; " +
    "frame-src https://js.stripe.com; " +
    "worker-src 'self' blob:;"
  );
  
  // 引用者策略
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// 应用通用速率限制
app.use('/api/', generalLimiter);

// 性能监控中间件（仅在开发环境启用详细监控）
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/', queryPerformanceMiddleware);
}

// For Stripe webhook, we need raw body
app.use('/api/payments/webhook', express.raw({type: 'application/json'}));
app.use(express.json({ limit: '10mb' })); // 限制请求体大小
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport
app.use(passport.initialize());

// Webhook日志中间件
app.use((req, res, next) => {
  if (req.path.includes('/webhook/')) {
    req.startTime = Date.now();
    console.log(`\n📨 ${req.method} ${req.path}`);
    console.log('Headers:', {
      'content-type': req.headers['content-type'],
      'x-twilio-signature': req.headers['x-twilio-signature'] ? '✓' : '✗'
    });
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Body:', req.body);
    }
    
    const originalSend = res.send;
    res.send = function(data) {
      console.log(`✅ Response: ${res.statusCode} in ${Date.now() - req.startTime}ms`);
      originalSend.call(this, data);
    };
  }
  next();
});

// Health check endpoint for Docker
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '../client/build')));

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/calls', callLimiter, require('./routes/calls'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/twilio', callLimiter, require('./routes/twilio'));
app.use('/api/recordings', require('./routes/recordings'));
// app.use('/api/incoming', require('./routes/incoming')); // ❌ 已禁用：避免与 incoming-calls 路由重复创建记录
app.use('/api/phone-numbers', require('./routes/phone-numbers'));
app.use('/api/incoming-calls', require('./routes/incoming-calls')); // ✅ 使用新的来电处理路由
app.use('/api/call-response', require('./routes/call-response'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/rates', require('./routes/rates'));
app.use('/api/billing', require('./routes/billing'));

// Admin routes
app.use('/api/admin/auth', authLimiter, require('./routes/adminAuth'));
app.use('/api/admin/data', require('./routes/adminData'));
app.use('/api/admin/dashboard', require('./routes/adminDashboard'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin/calls', require('./routes/adminCalls'));
app.use('/api/admin/numbers', require('./routes/adminNumbers'));
app.use('/api/admin/finance', require('./routes/adminFinance'));

// 性能监控端点（仅开发环境）
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/performance/report', (req, res) => {
    try {
      const report = getPerformanceReport();
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate performance report',
        error: error.message
      });
    }
  });
}

// Handle SPA routing
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.get('/reset-password/:token', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.get('/auth/social-callback', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.get('/terms-of-service', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.get('/cookie-policy', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// PostgreSQL connection and sync
const initializeDatabase = async () => {
  try {
    await testConnection();
    
    console.log('📊 Starting database initialization...');
    
    // 🔄 Phase 0: Run pending migrations BEFORE Sequelize.sync()
    console.log('🔄 Phase 0: Running pending migrations...');
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Run Sequelize migrations
      const migrationResult = await execAsync('npx sequelize-cli db:migrate', {
        cwd: __dirname,
        env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' }
      });
      
      console.log('✅ Phase 0 completed: Migrations executed successfully');
      if (migrationResult.stdout) {
        console.log('Migration output:', migrationResult.stdout);
      }
    } catch (migrationError) {
      console.warn('⚠️ Migration warning:', migrationError.message);
      // Continue even if migrations fail, as they might not be needed
      console.log('📋 Continuing with manual table creation...');
    }
    
    // Migration优先策略：完全依赖Migration管理数据库结构
    console.log('🔄 Phase 1: Verifying database connection...');
    
    // 仅验证数据库连接，不进行任何表结构修改
    // 所有表结构变更都通过Migration处理，避免运行时冲突
    await sequelize.authenticate();
    
    console.log('✅ Phase 1 completed: Database connection verified');
    
    console.log('🔄 Phase 2: Verifying foreign key constraints...');
    await addForeignKeyConstraints();
    console.log('✅ Phase 2 completed: Constraints verified');
    
    // Initialize admin system (create default admin user and roles)
    console.log('🔄 Phase 3: Initializing admin system...');
    try {
      const initializeAdmin = require('./scripts/init-admin');
      await initializeAdmin();
      console.log('✅ Phase 3 completed: Admin system initialized');
    } catch (error) {
      console.warn('⚠️ Admin initialization warning:', error.message);
      // Don't fail server startup if admin init fails
    }
    
    console.log('🔄 Phase 4: Performing database health check...');
    const healthCheckPassed = await performDatabaseHealthCheck();
    if (healthCheckPassed) {
      console.log('✅ Phase 4 completed: Database health check passed');
    } else {
      console.warn('⚠️ Phase 4 warning: Database health check failed');
    }
    
    console.log('🎉 Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql || 'No SQL query available'
    });
    
    // 在生产环境中，数据库初始化失败应该终止启动
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Production database initialization failed - exiting');
      process.exit(1);
    } else {
      console.warn('⚠️ Development mode - continuing despite database errors');
    }
  }
};

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// 启动服务器
const startServer = async () => {
  await initializeDatabase();
  
  // Initialize WebSocket
  webSocketManager.initialize(server);
  
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`🌍 Global rates: 150+ countries supported`);
    console.log(`📱 WebSocket server ready for real-time notifications`);
    
    // Keep server warm - ping health endpoint every 4 minutes
    if (process.env.NODE_ENV === 'production' || process.env.KEEP_ALIVE === 'true') {
      console.log('🏃 Keep-alive mechanism enabled');
      setInterval(() => {
        const timestamp = new Date().toISOString();
        console.log(`🏃 Keep-alive ping at ${timestamp}`);
        
        // 可选：自己ping自己的健康检查端点
        if (process.env.APP_URL || process.env.BASE_URL) {
          const https = require('https');
          const healthUrl = `${process.env.APP_URL || process.env.BASE_URL}/api/health`;
          https.get(healthUrl, (res) => {
            console.log(`🏃 Self-ping status: ${res.statusCode}`);
          }).on('error', (err) => {
            console.log(`🏃 Self-ping error: ${err.message}`);
          });
        }
      }, 4 * 60 * 1000); // 每4分钟
    }
  });
};

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 