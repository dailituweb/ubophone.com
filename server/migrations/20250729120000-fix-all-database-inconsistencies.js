'use strict';

/**
 * Comprehensive Migration: Fix All Database Structure Inconsistencies
 * 
 * This migration addresses:
 * 1. Missing columns in existing tables
 * 2. Column type mismatches between models and database
 * 3. Missing indexes and constraints
 * 4. ENUM values inconsistencies
 * 5. Foreign key constraint issues
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔧 Starting comprehensive database structure fix...');
      
      // ==================== PHASE 1: Fix Admin Tables ====================
      console.log('📋 Phase 1: Fixing admin table structures...');
      
      // Check if admin_roles table exists, if not create it
      const adminRolesExists = await queryInterface.tableExists('admin_roles');
      if (!adminRolesExists) {
        console.log('📝 Creating admin_roles table...');
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
      }
      
      // Fix admin_sessions table structure
      const adminSessionsExists = await queryInterface.tableExists('admin_sessions');
      if (adminSessionsExists) {
        console.log('🔧 Fixing admin_sessions table structure...');
        const adminSessionsDesc = await queryInterface.describeTable('admin_sessions');
        
        // Fix token column type to TEXT
        if (adminSessionsDesc.token && adminSessionsDesc.token.type !== 'TEXT') {
          console.log('📝 Updating token column type to TEXT...');
          await queryInterface.changeColumn('admin_sessions', 'token', {
            type: Sequelize.TEXT,
            allowNull: false
          }, { transaction });
        }
        
        // Add missing refreshToken column
        if (!adminSessionsDesc.refreshToken) {
          console.log('📝 Adding refreshToken column...');
          await queryInterface.addColumn('admin_sessions', 'refreshToken', {
            type: Sequelize.TEXT,
            allowNull: true
          }, { transaction });
        } else if (adminSessionsDesc.refreshToken && adminSessionsDesc.refreshToken.type !== 'TEXT') {
          console.log('📝 Updating refreshToken column type to TEXT...');
          await queryInterface.changeColumn('admin_sessions', 'refreshToken', {
            type: Sequelize.TEXT,
            allowNull: true
          }, { transaction });
        }
        
        // Add missing refreshExpiresAt column
        if (!adminSessionsDesc.refreshExpiresAt) {
          console.log('📝 Adding refreshExpiresAt column...');
          await queryInterface.addColumn('admin_sessions', 'refreshExpiresAt', {
            type: Sequelize.DATE,
            allowNull: true
          }, { transaction });
        }
        
        // Add missing isActive column
        if (!adminSessionsDesc.isActive) {
          console.log('📝 Adding isActive column...');
          await queryInterface.addColumn('admin_sessions', 'isActive', {
            type: Sequelize.BOOLEAN,
            defaultValue: true
          }, { transaction });
        }
        
        // Add missing lastActivity column
        if (!adminSessionsDesc.lastActivity) {
          console.log('📝 Adding lastActivity column...');
          await queryInterface.addColumn('admin_sessions', 'lastActivity', {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          }, { transaction });
        }
        
        // Add missing deviceInfo column
        if (!adminSessionsDesc.deviceInfo) {
          console.log('📝 Adding deviceInfo column...');
          await queryInterface.addColumn('admin_sessions', 'deviceInfo', {
            type: Sequelize.JSONB,
            defaultValue: {
              browser: null,
              os: null,
              device: null,
              location: null
            }
          }, { transaction });
        }
      }
      
      // Fix admin_audit_logs table to allow NULL adminId
      const adminAuditLogsExists = await queryInterface.tableExists('admin_audit_logs');
      if (adminAuditLogsExists) {
        console.log('🔧 Fixing admin_audit_logs table structure...');
        const adminAuditLogsDesc = await queryInterface.describeTable('admin_audit_logs');
        
        if (adminAuditLogsDesc.adminId && !adminAuditLogsDesc.adminId.allowNull) {
          console.log('📝 Updating adminId column to allow NULL...');
          await queryInterface.changeColumn('admin_audit_logs', 'adminId', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'admins',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          }, { transaction });
        }
      }
      
      // ==================== PHASE 2: Fix User Phone Numbers Table ====================
      console.log('📋 Phase 2: Fixing user_phone_numbers table...');
      
      const userPhoneNumbersExists = await queryInterface.tableExists('user_phone_numbers');
      if (userPhoneNumbersExists) {
        const userPhoneNumbersDesc = await queryInterface.describeTable('user_phone_numbers');
        
        // Add missing totalIncomingSeconds column
        if (!userPhoneNumbersDesc.totalIncomingSeconds) {
          console.log('📝 Adding totalIncomingSeconds column...');
          await queryInterface.addColumn('user_phone_numbers', 'totalIncomingSeconds', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          }, { transaction });
        }
        
        // Add missing totalAnsweredCalls column
        if (!userPhoneNumbersDesc.totalAnsweredCalls) {
          console.log('📝 Adding totalAnsweredCalls column...');
          await queryInterface.addColumn('user_phone_numbers', 'totalAnsweredCalls', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          }, { transaction });
        }
      }
      
      // ==================== PHASE 3: Fix ENUM Values ====================
      console.log('📋 Phase 3: Fixing ENUM values...');
      
      // Add 'answered' to calls status enum if not exists
      try {
        await queryInterface.sequelize.query(
          "ALTER TYPE \"enum_calls_status\" ADD VALUE IF NOT EXISTS 'answered';",
          { transaction }
        );
        console.log('✅ Added "answered" to calls status enum');
      } catch (error) {
        console.log('ℹ️ ENUM value "answered" already exists or enum does not exist');
      }
      
      // Add 'missed' and 'canceled' to calls status enum if not exists
      try {
        await queryInterface.sequelize.query(
          "ALTER TYPE \"enum_calls_status\" ADD VALUE IF NOT EXISTS 'missed';",
          { transaction }
        );
        await queryInterface.sequelize.query(
          "ALTER TYPE \"enum_calls_status\" ADD VALUE IF NOT EXISTS 'canceled';",
          { transaction }
        );
        console.log('✅ Added "missed" and "canceled" to calls status enum');
      } catch (error) {
        console.log('ℹ️ ENUM values already exist or enum does not exist');
      }
      
      // Add 'missed' and 'canceled' to incoming_calls status enum if not exists
      try {
        await queryInterface.sequelize.query(
          "ALTER TYPE \"enum_incoming_calls_status\" ADD VALUE IF NOT EXISTS 'missed';",
          { transaction }
        );
        await queryInterface.sequelize.query(
          "ALTER TYPE \"enum_incoming_calls_status\" ADD VALUE IF NOT EXISTS 'canceled';",
          { transaction }
        );
        console.log('✅ Added "missed" and "canceled" to incoming_calls status enum');
      } catch (error) {
        console.log('ℹ️ ENUM values already exist or enum does not exist');
      }
      
      // ==================== PHASE 4: Create Missing Indexes ====================
      console.log('📋 Phase 4: Creating missing indexes...');
      
      // Function to safely create index
      const safelyCreateIndex = async (tableName, columns, options = {}) => {
        try {
          const indexName = options.name || `${tableName}_${columns.join('_')}_idx`;
          
          // Check if index already exists
          const existingIndexes = await queryInterface.sequelize.query(
            `SELECT indexname FROM pg_indexes WHERE tablename = '${tableName}' AND indexname = '${indexName}'`,
            { type: Sequelize.QueryTypes.SELECT, transaction }
          );
          
          if (existingIndexes.length === 0) {
            await queryInterface.addIndex(tableName, columns, { ...options, transaction });
            console.log(`✅ Created index: ${indexName}`);
          } else {
            console.log(`ℹ️ Index already exists: ${indexName}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to create index on ${tableName}(${columns.join(', ')}):`, error.message);
        }
      };
      
      // Create admin_sessions indexes
      if (adminSessionsExists) {
        await safelyCreateIndex('admin_sessions', ['token'], {
          unique: true,
          name: 'admin_sessions_token_unique_idx'
        });
        
        await safelyCreateIndex('admin_sessions', ['refreshToken'], {
          unique: true,
          name: 'admin_sessions_refresh_token_unique_idx'
        });
        
        await safelyCreateIndex('admin_sessions', ['adminId'], {
          name: 'admin_sessions_admin_id_idx'
        });
        
        await safelyCreateIndex('admin_sessions', ['expiresAt'], {
          name: 'admin_sessions_expires_at_idx'
        });
        
        await safelyCreateIndex('admin_sessions', ['isActive'], {
          name: 'admin_sessions_is_active_idx'
        });
      }
      
      // ==================== PHASE 5: Create Default Admin Role ====================
      console.log('📋 Phase 5: Creating default admin role...');
      
      if (adminRolesExists || await queryInterface.tableExists('admin_roles')) {
        try {
          await queryInterface.sequelize.query(`
            INSERT INTO admin_roles (id, name, description, permissions, "isSystemRole", "isActive", priority, "createdAt", "updatedAt")
            VALUES (
              gen_random_uuid(),
              'Super Admin',
              'Full system access with all permissions',
              '{"dashboard":{"read":true,"write":true},"users":{"read":true,"write":true,"delete":true},"calls":{"read":true,"write":true,"delete":true},"billing":{"read":true,"write":true},"analytics":{"read":true,"write":true},"settings":{"read":true,"write":true},"admins":{"read":true,"write":true,"delete":true},"logs":{"read":true},"system":{"read":true,"write":true}}',
              true,
              true,
              100,
              NOW(),
              NOW()
            )
            ON CONFLICT (name) DO NOTHING
          `, { transaction });
          console.log('✅ Created default Super Admin role');
        } catch (error) {
          console.warn('⚠️ Failed to create default admin role:', error.message);
        }
      }
      
      // ==================== PHASE 6: Fix Foreign Key References ====================
      console.log('📋 Phase 6: Fixing foreign key references...');
      
      // Update existing admin records to have roleId if they don't
      const adminsExists = await queryInterface.tableExists('admins');
      if (adminsExists && (adminRolesExists || await queryInterface.tableExists('admin_roles'))) {
        try {
          const [adminsWithoutRole] = await queryInterface.sequelize.query(`
            SELECT COUNT(*) as count FROM admins WHERE "roleId" IS NULL
          `, { transaction });
          
          if (adminsWithoutRole[0].count > 0) {
            const [roleResult] = await queryInterface.sequelize.query(`
              SELECT id FROM admin_roles WHERE name = 'Super Admin' LIMIT 1
            `, { transaction });
            
            if (roleResult && roleResult.length > 0) {
              const superAdminRoleId = roleResult[0].id;
              await queryInterface.sequelize.query(`
                UPDATE admins SET "roleId" = :roleId WHERE "roleId" IS NULL
              `, { 
                replacements: { roleId: superAdminRoleId },
                transaction
              });
              console.log(`✅ Updated ${adminsWithoutRole[0].count} admin records with Super Admin role`);
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to update admin role references:', error.message);
        }
      }
      
      await transaction.commit();
      console.log('🎉 Comprehensive database structure fix completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('⏪ Rolling back comprehensive database structure fix...');
      
      // Note: Rolling back ENUM changes and some structural changes can be complex
      // and potentially destructive. This rollback focuses on the safest operations.
      
      // Remove added columns from user_phone_numbers
      const userPhoneNumbersExists = await queryInterface.tableExists('user_phone_numbers');
      if (userPhoneNumbersExists) {
        const userPhoneNumbersDesc = await queryInterface.describeTable('user_phone_numbers');
        
        if (userPhoneNumbersDesc.totalIncomingSeconds) {
          await queryInterface.removeColumn('user_phone_numbers', 'totalIncomingSeconds', { transaction });
        }
        
        if (userPhoneNumbersDesc.totalAnsweredCalls) {
          await queryInterface.removeColumn('user_phone_numbers', 'totalAnsweredCalls', { transaction });
        }
      }
      
      // Remove added columns from admin_sessions
      const adminSessionsExists = await queryInterface.tableExists('admin_sessions');
      if (adminSessionsExists) {
        const adminSessionsDesc = await queryInterface.describeTable('admin_sessions');
        
        if (adminSessionsDesc.refreshToken) {
          await queryInterface.removeColumn('admin_sessions', 'refreshToken', { transaction });
        }
        
        if (adminSessionsDesc.refreshExpiresAt) {
          await queryInterface.removeColumn('admin_sessions', 'refreshExpiresAt', { transaction });
        }
        
        if (adminSessionsDesc.deviceInfo) {
          await queryInterface.removeColumn('admin_sessions', 'deviceInfo', { transaction });
        }
      }
      
      await transaction.commit();
      console.log('✅ Rollback completed');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};