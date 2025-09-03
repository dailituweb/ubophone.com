const jwt = require('jsonwebtoken');
const { Admin, AdminSession } = require('../models');

// 确保JWT_SECRET环境变量存在
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  process.exit(1);
}

// 管理员认证中间件
const adminAuth = async (req, res, next) => {
  try {
    // 获取token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No admin token provided.',
        code: 'NO_TOKEN' 
      });
    }

    // 验证token with strict validation
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'ubophone-api',
      maxAge: process.env.JWT_EXPIRES_IN || '24h'
    });
    
    // 检查是否是管理员token
    if (!decoded.adminId) {
      return res.status(401).json({ 
        message: 'Access denied. Invalid admin token.',
        code: 'INVALID_ADMIN_TOKEN' 
      });
    }

    // 查找管理员会话
    const session = await AdminSession.findOne({
      where: { 
        token: token,
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
        message: 'Access denied. Session not found or expired.',
        code: 'SESSION_NOT_FOUND' 
      });
    }

    // 检查会话是否过期
    if (new Date() > session.expiresAt) {
      await session.update({ isActive: false });
      return res.status(401).json({ 
        message: 'Access denied. Session expired.',
        code: 'SESSION_EXPIRED' 
      });
    }

    // 检查管理员是否激活
    if (!session.admin.isActive) {
      return res.status(401).json({ 
        message: 'Access denied. Admin account disabled.',
        code: 'ADMIN_DISABLED' 
      });
    }

    // 添加管理员信息到请求对象
    req.admin = session.admin;
    req.adminSession = session;
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Access denied. Invalid token.',
        code: 'INVALID_TOKEN' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Access denied. Token expired.',
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error during authentication.',
      code: 'AUTH_ERROR' 
    });
  }
};

// 权限检查中间件
const checkPermission = (resource, action = 'read') => {
  return (req, res, next) => {
    try {
      const admin = req.admin;
      
      // 超级管理员拥有所有权限
      if (admin.role === 'super_admin') {
        return next();
      }
      
      // 检查权限
      const permissions = admin.permissions || {};
      const resourcePermissions = permissions[resource] || [];
      
      if (!resourcePermissions.includes(action) && !resourcePermissions.includes('all')) {
        return res.status(403).json({
          message: `Access denied. Missing ${action} permission for ${resource}.`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        message: 'Internal server error during permission check.',
        code: 'PERMISSION_ERROR'
      });
    }
  };
};

// 角色检查中间件
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const admin = req.admin;
      
      if (!allowedRoles.includes(admin.role)) {
        return res.status(403).json({
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
          code: 'INSUFFICIENT_ROLE'
        });
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        message: 'Internal server error during role check.',
        code: 'ROLE_ERROR'
      });
    }
  };
};

module.exports = {
  adminAuth,
  checkPermission,
  checkRole
}; 