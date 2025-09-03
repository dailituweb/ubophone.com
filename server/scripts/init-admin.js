#!/usr/bin/env node

const { sequelize, Op } = require('../config/database');
const { Admin, AdminRole } = require('../models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function initializeAdmin() {
  try {
    console.log('🔄 Initializing admin system...');
    
    // Check if super admin role exists
    let superAdminRole = await AdminRole.findOne({
      where: { name: 'super_admin' }
    });
    
    if (!superAdminRole) {
      console.log('🔧 Creating admin roles...');
      
      // Create admin roles
      const superAdminRoleId = uuidv4();
      const adminRoleId = uuidv4();
      const moderatorRoleId = uuidv4();
      const viewerRoleId = uuidv4();

      const roles = [
        {
          id: superAdminRoleId,
          name: 'super_admin',
          description: 'Super Administrator with full system access',
          permissions: {
            dashboard: { read: true, write: true },
            users: { read: true, write: true, delete: true },
            calls: { read: true, write: true, delete: true },
            billing: { read: true, write: true },
            analytics: { read: true, write: true },
            settings: { read: true, write: true },
            admins: { read: true, write: true, delete: true },
            logs: { read: true },
            system: { read: true, write: true }
          },
          isSystemRole: true,
          isActive: true,
          priority: 1000
        },
        {
          id: adminRoleId,
          name: 'admin',
          description: 'Administrator with most system access',
          permissions: {
            dashboard: { read: true, write: true },
            users: { read: true, write: true, delete: false },
            calls: { read: true, write: true, delete: false },
            billing: { read: true, write: true },
            analytics: { read: true, write: false },
            settings: { read: true, write: true },
            admins: { read: true, write: false, delete: false },
            logs: { read: true },
            system: { read: true, write: false }
          },
          isSystemRole: true,
          isActive: true,
          priority: 500
        },
        {
          id: moderatorRoleId,
          name: 'moderator',
          description: 'Moderator with limited administrative access',
          permissions: {
            dashboard: { read: true, write: false },
            users: { read: true, write: true, delete: false },
            calls: { read: true, write: false, delete: false },
            billing: { read: true, write: false },
            analytics: { read: true, write: false },
            settings: { read: true, write: false },
            admins: { read: false, write: false, delete: false },
            logs: { read: true },
            system: { read: false, write: false }
          },
          isSystemRole: true,
          isActive: true,
          priority: 100
        },
        {
          id: viewerRoleId,
          name: 'viewer',
          description: 'Read-only access to system data',
          permissions: {
            dashboard: { read: true, write: false },
            users: { read: true, write: false, delete: false },
            calls: { read: true, write: false, delete: false },
            billing: { read: true, write: false },
            analytics: { read: true, write: false },
            settings: { read: false, write: false },
            admins: { read: false, write: false, delete: false },
            logs: { read: false },
            system: { read: false, write: false }
          },
          isSystemRole: true,
          isActive: true,
          priority: 10
        }
      ];

      await AdminRole.bulkCreate(roles);
      superAdminRole = await AdminRole.findOne({ where: { id: superAdminRoleId } });
      console.log('✅ Admin roles created');
    } else {
      console.log('✅ Admin roles already exist');
    }
    
    // Check if super admin user exists (check both username and email)
    const existingSuperAdmin = await Admin.findOne({
      where: { 
        [Op.or]: [
          { username: 'superadmin' },
          { email: 'admin@ubophone.com' }
        ]
      }
    });
    
    if (!existingSuperAdmin) {
      console.log('🔧 Creating super admin user...');
      
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
      
      await Admin.create({
        username: 'superadmin',
        email: 'admin@ubophone.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Administrator',
        roleId: superAdminRole.id,
        isActive: true,
        loginAttempts: 0,
        passwordChangedAt: new Date(),
        twoFactorEnabled: false,
        emergencyAccessCodes: [],
        sessionTokens: [],
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          emailNotifications: true,
          dashboardLayout: 'default'
        },
        metadata: {
          createdBy: 'system',
          isDefaultAccount: true
        }
      });
      
      console.log('✅ Super admin user created');
      console.log('📝 Default login credentials:');
      console.log('   Username: superadmin');
      console.log('   Password: SuperAdmin123!');
    } else {
      console.log('✅ Super admin user already exists');
    }
    
    console.log('🎉 Admin system initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Admin initialization failed:', error);
    throw error;
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeAdmin()
    .then(() => {
      console.log('✅ Standalone admin initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = initializeAdmin;