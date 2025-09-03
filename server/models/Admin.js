'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

// 管理员模型
const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 255]
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  roleId: {
    type: DataTypes.UUID,
    allowNull: true, // 暂时允许null，由自定义逻辑处理
    // 移除直接的外键引用，由addForeignKeyConstraints处理
    // references: {
    //   model: 'admin_roles',
    //   key: 'id'
    // }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginIp: {
    type: DataTypes.INET,
    allowNull: true
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergencyAccessCodes: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  sessionTokens: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      emailNotifications: true,
      dashboardLayout: 'default'
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'admins',
  indexes: [
    // 暂时禁用所有索引定义，通过Migration创建
    // 这避免了Sequelize.sync()尝试在不存在的列上创建索引
  ],
  hooks: {
    beforeCreate: async (admin) => {
      if (admin.password) {
        const salt = await bcrypt.genSalt(12);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        admin.password = await bcrypt.hash(admin.password, salt);
        admin.passwordChangedAt = new Date();
      }
    }
  }
});

// 实例方法
Admin.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

Admin.prototype.isLocked = function() {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
};

Admin.prototype.incrementLoginAttempts = async function() {
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30分钟

  if (this.lockedUntil && this.lockedUntil < Date.now()) {
    return this.update({
      loginAttempts: 1,
      lockedUntil: null
    });
  }

  const updates = { loginAttempts: this.loginAttempts + 1 };
  
  if (updates.loginAttempts >= maxAttempts && !this.isLocked()) {
    updates.lockedUntil = new Date(Date.now() + lockTime);
  }

  return this.update(updates);
};

Admin.prototype.resetLoginAttempts = async function() {
  return this.update({
    loginAttempts: 0,
    lockedUntil: null
  });
};

Admin.prototype.updateLastLogin = async function(ipAddress) {
  return this.update({
    lastLogin: new Date(),
    lastLoginIp: ipAddress
  });
};

// 管理员角色模型
const AdminRole = sequelize.define('AdminRole', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 50]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {
      dashboard: { read: false, write: false },
      users: { read: false, write: false, delete: false },
      calls: { read: false, write: false, delete: false },
      billing: { read: false, write: false },
      analytics: { read: false, write: false },
      settings: { read: false, write: false },
      admins: { read: false, write: false, delete: false },
      logs: { read: false },
      system: { read: false, write: false }
    }
  },
  isSystemRole: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'admin_roles',
  indexes: [
    // 暂时禁用所有索引定义，通过Migration创建
  ],
});

// 管理员操作日志模型
const AdminAuditLog = sequelize.define('AdminAuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: true, // 修复：允许为null，以支持匿名操作的审计日志（如登录失败）
    references: {
      model: Admin,
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resourceId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  method: {
    type: DataTypes.ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
    allowNull: false
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: false
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requestData: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  responseStatus: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'admin_audit_logs',
  indexes: [
    // 暂时禁用所有索引定义，通过Migration创建
  ]
});

// 管理员会话模型
const AdminSession = sequelize.define('AdminSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Admin,
      key: 'id'
    }
  },
  token: {
    type: DataTypes.TEXT, // 修复：将 STRING (varchar(255)) 改为 TEXT 以存储更长的JWT
    allowNull: false,
    unique: true
  },
  refreshToken: {
    type: DataTypes.TEXT, // 修复：将 STRING (varchar(255)) 改为 TEXT 以存储更长的JWT
    allowNull: true,
    unique: true
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: false
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  refreshExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastActivity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deviceInfo: {
    type: DataTypes.JSONB,
    defaultValue: {
      browser: null,
      os: null,
      device: null,
      location: null
    }
  }
}, {
  timestamps: true,
  tableName: 'admin_sessions',
  // 完全移除索引定义，避免Sequelize.sync()尝试创建不存在列的索引
  // 所有索引将通过Migration创建
  indexes: []
});

// 定义关联关系
AdminRole.hasMany(Admin, { foreignKey: 'roleId', as: 'admins' });
Admin.belongsTo(AdminRole, { foreignKey: 'roleId', as: 'role' });

Admin.hasMany(AdminAuditLog, { foreignKey: 'adminId', as: 'auditLogs' });
AdminAuditLog.belongsTo(Admin, { foreignKey: 'adminId', as: 'admin' });

Admin.hasMany(AdminSession, { foreignKey: 'adminId', as: 'sessions' });
AdminSession.belongsTo(Admin, { foreignKey: 'adminId', as: 'admin' });

module.exports = {
  Admin,
  AdminRole,
  AdminAuditLog,
  AdminSession
};