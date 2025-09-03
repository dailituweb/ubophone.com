'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Create admin roles table
      await queryInterface.createTable('admin_roles', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        permissions: {
          type: Sequelize.JSONB,
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
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        priority: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // Create admins table
      await queryInterface.createTable('admins', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        username: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false
        },
        firstName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        lastName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        roleId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'admin_roles',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        lastLogin: {
          type: Sequelize.DATE,
          allowNull: true
        },
        lastLoginIp: {
          type: Sequelize.INET,
          allowNull: true
        },
        loginAttempts: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        lockedUntil: {
          type: Sequelize.DATE,
          allowNull: true
        },
        passwordChangedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        },
        twoFactorEnabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        twoFactorSecret: {
          type: Sequelize.STRING,
          allowNull: true
        },
        emergencyAccessCodes: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        sessionTokens: {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        preferences: {
          type: Sequelize.JSONB,
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
          type: Sequelize.JSONB,
          defaultValue: {}
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // Create admin audit logs table
      await queryInterface.createTable('admin_audit_logs', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        adminId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'admins',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        action: {
          type: Sequelize.STRING,
          allowNull: false
        },
        resource: {
          type: Sequelize.STRING,
          allowNull: false
        },
        resourceId: {
          type: Sequelize.STRING,
          allowNull: true
        },
        method: {
          type: Sequelize.ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
          allowNull: false
        },
        endpoint: {
          type: Sequelize.STRING,
          allowNull: false
        },
        ipAddress: {
          type: Sequelize.INET,
          allowNull: false
        },
        userAgent: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        requestData: {
          type: Sequelize.JSONB,
          defaultValue: {}
        },
        responseStatus: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        duration: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        success: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        errorMessage: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        sessionId: {
          type: Sequelize.STRING,
          allowNull: true
        },
        metadata: {
          type: Sequelize.JSONB,
          defaultValue: {}
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // Create admin sessions table
      await queryInterface.createTable('admin_sessions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        adminId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'admins',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        token: {
          type: Sequelize.TEXT,
          allowNull: false,
          unique: true
        },
        refreshToken: {
          type: Sequelize.TEXT,
          allowNull: true,
          unique: true
        },
        ipAddress: {
          type: Sequelize.INET,
          allowNull: false
        },
        userAgent: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        expiresAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        refreshExpiresAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        lastActivity: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        },
        deviceInfo: {
          type: Sequelize.JSONB,
          defaultValue: {
            browser: null,
            os: null,
            device: null,
            location: null
          }
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // Create indexes
      await queryInterface.addIndex('admin_roles', ['name'], {
        unique: true,
        name: 'admin_roles_name_unique_idx',
        transaction
      });

      await queryInterface.addIndex('admin_roles', ['isActive'], {
        name: 'admin_roles_is_active_idx',
        transaction
      });

      await queryInterface.addIndex('admins', ['email'], {
        unique: true,
        name: 'admins_email_unique_idx',
        transaction
      });

      await queryInterface.addIndex('admins', ['username'], {
        unique: true,
        name: 'admins_username_unique_idx',
        transaction
      });

      await queryInterface.addIndex('admins', ['roleId'], {
        name: 'admins_role_id_idx',
        transaction
      });

      await queryInterface.addIndex('admins', ['isActive'], {
        name: 'admins_is_active_idx',
        transaction
      });

      await queryInterface.addIndex('admin_audit_logs', ['adminId', 'createdAt'], {
        name: 'admin_audit_logs_admin_created_idx',
        transaction
      });

      await queryInterface.addIndex('admin_audit_logs', ['action'], {
        name: 'admin_audit_logs_action_idx',
        transaction
      });

      await queryInterface.addIndex('admin_audit_logs', ['resource'], {
        name: 'admin_audit_logs_resource_idx',
        transaction
      });

      await queryInterface.addIndex('admin_audit_logs', ['createdAt'], {
        name: 'admin_audit_logs_created_at_idx',
        transaction
      });

      await queryInterface.addIndex('admin_audit_logs', ['ipAddress'], {
        name: 'admin_audit_logs_ip_address_idx',
        transaction
      });

      await queryInterface.addIndex('admin_sessions', ['token'], {
        unique: true,
        name: 'admin_sessions_token_unique_idx',
        transaction
      });

      await queryInterface.addIndex('admin_sessions', ['refreshToken'], {
        unique: true,
        name: 'admin_sessions_refresh_token_unique_idx',
        transaction
      });

      await queryInterface.addIndex('admin_sessions', ['adminId'], {
        name: 'admin_sessions_admin_id_idx',
        transaction
      });

      await queryInterface.addIndex('admin_sessions', ['expiresAt'], {
        name: 'admin_sessions_expires_at_idx',
        transaction
      });

      await queryInterface.addIndex('admin_sessions', ['isActive'], {
        name: 'admin_sessions_is_active_idx',
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Drop tables (order matters - dependent tables first)
      await queryInterface.dropTable('admin_sessions', { transaction });
      await queryInterface.dropTable('admin_audit_logs', { transaction });
      await queryInterface.dropTable('admins', { transaction });
      await queryInterface.dropTable('admin_roles', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};