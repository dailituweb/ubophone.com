'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Create admin roles
      const superAdminRoleId = uuidv4();
      const adminRoleId = uuidv4();
      const moderatorRoleId = uuidv4();
      const viewerRoleId = uuidv4();

      await queryInterface.bulkInsert('admin_roles', [
        {
          id: superAdminRoleId,
          name: 'super_admin',
          description: 'Super Administrator with full system access',
          permissions: JSON.stringify({
            dashboard: { read: true, write: true },
            users: { read: true, write: true, delete: true },
            calls: { read: true, write: true, delete: true },
            billing: { read: true, write: true },
            analytics: { read: true, write: true },
            settings: { read: true, write: true },
            admins: { read: true, write: true, delete: true },
            logs: { read: true },
            system: { read: true, write: true }
          }),
          isSystemRole: true,
          isActive: true,
          priority: 1000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: adminRoleId,
          name: 'admin',
          description: 'Administrator with most system access',
          permissions: JSON.stringify({
            dashboard: { read: true, write: true },
            users: { read: true, write: true, delete: false },
            calls: { read: true, write: true, delete: false },
            billing: { read: true, write: true },
            analytics: { read: true, write: false },
            settings: { read: true, write: true },
            admins: { read: true, write: false, delete: false },
            logs: { read: true },
            system: { read: true, write: false }
          }),
          isSystemRole: true,
          isActive: true,
          priority: 500,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: moderatorRoleId,
          name: 'moderator',
          description: 'Moderator with limited administrative access',
          permissions: JSON.stringify({
            dashboard: { read: true, write: false },
            users: { read: true, write: true, delete: false },
            calls: { read: true, write: false, delete: false },
            billing: { read: true, write: false },
            analytics: { read: true, write: false },
            settings: { read: true, write: false },
            admins: { read: false, write: false, delete: false },
            logs: { read: true },
            system: { read: false, write: false }
          }),
          isSystemRole: true,
          isActive: true,
          priority: 100,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: viewerRoleId,
          name: 'viewer',
          description: 'Read-only access to system data',
          permissions: JSON.stringify({
            dashboard: { read: true, write: false },
            users: { read: true, write: false, delete: false },
            calls: { read: true, write: false, delete: false },
            billing: { read: true, write: false },
            analytics: { read: true, write: false },
            settings: { read: false, write: false },
            admins: { read: false, write: false, delete: false },
            logs: { read: false },
            system: { read: false, write: false }
          }),
          isSystemRole: true,
          isActive: true,
          priority: 10,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], { transaction });

      // Create default super admin account
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
      const superAdminId = uuidv4();

      await queryInterface.bulkInsert('admins', [
        {
          id: superAdminId,
          username: 'superadmin',
          email: 'admin@ubophone.com',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Administrator',
          roleId: superAdminRoleId,
          isActive: true,
          loginAttempts: 0,
          passwordChangedAt: new Date(),
          twoFactorEnabled: false,
          emergencyAccessCodes: JSON.stringify([]),
          sessionTokens: JSON.stringify([]),
          preferences: JSON.stringify({
            theme: 'light',
            language: 'en',
            timezone: 'UTC',
            dateFormat: 'YYYY-MM-DD',
            emailNotifications: true,
            dashboardLayout: 'default'
          }),
          metadata: JSON.stringify({
            createdBy: 'system',
            isDefaultAccount: true
          }),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove all admin data
      await queryInterface.bulkDelete('admins', null, { transaction });
      await queryInterface.bulkDelete('admin_roles', null, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};