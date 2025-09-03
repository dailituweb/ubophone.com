const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin, AdminSession, AdminAuditLog } = require('../models');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// 管理员登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`🔐 Admin login attempt: ${username}`);

    // 查找管理员
    const admin = await Admin.findOne({ 
      where: { username } 
    });

    if (!admin) {
      console.log(`❌ Admin not found: ${username}`);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS' 
      });
    }

    // 检查管理员是否激活
    if (!admin.isActive) {
      console.log(`❌ Admin account disabled: ${username}`);
      return res.status(401).json({ 
        message: 'Account is disabled',
        code: 'ACCOUNT_DISABLED' 
      });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log(`❌ Invalid password for admin: ${username}`);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS' 
      });
    }

    console.log(`✅ Admin login successful: ${admin.username}`);

    // 生成会话ID和token
    const sessionId = require('crypto').randomUUID();
    const tokenPayload = { 
      adminId: admin.id,
      sessionId: sessionId,
      role: admin.role
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { 
      expiresIn: '8h' // 管理员会话8小时
    });

    const refreshToken = jwt.sign(
      { adminId: admin.id, sessionId: sessionId, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 创建会话记录
    const session = await AdminSession.create({
      adminId: admin.id,
      token: token,
      refreshToken: refreshToken,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8小时
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 更新最后登录时间
    await admin.update({ lastLogin: new Date() });

    // 记录审计日志
    await AdminAuditLog.create({
      adminId: admin.id,
      action: 'login',
      resource: 'admin_auth',
      details: { 
        username: admin.username,
        sessionId: session.id 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      token: token,
      refreshToken: refreshToken,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      expiresAt: session.expiresAt
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR' 
    });
  }
});

// 管理员登出
router.post('/logout', adminAuth, async (req, res) => {
  try {
    // 停用当前会话
    await req.adminSession.update({ isActive: false });

    // 记录审计日志
    await AdminAuditLog.create({
      adminId: req.admin.id,
      action: 'logout',
      resource: 'admin_auth',
      details: { 
        sessionId: req.adminSession.id 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });

  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR' 
    });
  }
});

// 获取当前管理员信息
router.get('/me', adminAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      admin: {
        id: req.admin.id,
        username: req.admin.username,
        email: req.admin.email,
        role: req.admin.role,
        permissions: req.admin.permissions,
        lastLogin: req.admin.lastLogin
      },
      session: {
        expiresAt: req.adminSession.expiresAt
      }
    });
  } catch (error) {
    console.error('Get admin info error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR' 
    });
  }
});

// 刷新token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        message: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN' 
      });
    }

    // 验证refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ 
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN' 
      });
    }

    // 查找会话
    const session = await AdminSession.findOne({
      where: { 
        refreshToken: refreshToken,
        adminId: decoded.adminId,
        isActive: true
      },
      include: [{
        model: Admin,
        as: 'admin',
        attributes: { exclude: ['password'] }
      }]
    });

    if (!session) {
      return res.status(401).json({ 
        message: 'Session not found',
        code: 'SESSION_NOT_FOUND' 
      });
    }

    // 生成新的access token
    const newToken = jwt.sign(
      { 
        adminId: session.adminId,
        sessionId: decoded.sessionId,
        role: session.admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 更新会话
    await session.update({
      token: newToken,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
    });

    res.json({
      success: true,
      token: newToken,
      expiresAt: session.expiresAt
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN' 
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR' 
    });
  }
});

// 获取活跃会话列表
router.get('/sessions', adminAuth, async (req, res) => {
  try {
    const sessions = await AdminSession.findAll({
      where: { 
        adminId: req.admin.id,
        isActive: true
      },
      attributes: ['id', 'createdAt', 'expiresAt', 'ipAddress', 'userAgent'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      sessions: sessions
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR' 
    });
  }
});

// 终止指定会话
router.delete('/sessions/:sessionId', adminAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AdminSession.findOne({
      where: { 
        id: sessionId,
        adminId: req.admin.id,
        isActive: true
      }
    });

    if (!session) {
      return res.status(404).json({ 
        message: 'Session not found',
        code: 'SESSION_NOT_FOUND' 
      });
    }

    await session.update({ isActive: false });

    // 记录审计日志
    await AdminAuditLog.create({
      adminId: req.admin.id,
      action: 'terminate_session',
      resource: 'admin_auth',
      details: { 
        terminatedSessionId: sessionId 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ 
      success: true,
      message: 'Session terminated successfully' 
    });

  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR' 
    });
  }
});

module.exports = router; 