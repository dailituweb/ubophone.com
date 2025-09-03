'use strict';

/**
 * Fix admin_sessions table schema to match the Admin.js model
 * Add missing columns and update existing ones
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 修复 admin_sessions 表结构...');
    
    try {
      // Check if refreshToken column exists
      const tableDescription = await queryInterface.describeTable('admin_sessions');
      
      // Add missing columns if they don't exist
      if (!tableDescription.refreshToken) {
        console.log('📝 添加 refreshToken 字段...');
        await queryInterface.addColumn('admin_sessions', 'refreshToken', {
          type: Sequelize.TEXT,
          allowNull: true,
          unique: true
        });
      }
      
      if (!tableDescription.refreshExpiresAt) {
        console.log('📝 添加 refreshExpiresAt 字段...');
        await queryInterface.addColumn('admin_sessions', 'refreshExpiresAt', {
          type: Sequelize.DATE,
          allowNull: true
        });
      }
      
      if (!tableDescription.lastActivity) {
        console.log('📝 添加 lastActivity 字段...');
        await queryInterface.addColumn('admin_sessions', 'lastActivity', {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        });
      }
      
      if (!tableDescription.deviceInfo) {
        console.log('📝 添加 deviceInfo 字段...');
        await queryInterface.addColumn('admin_sessions', 'deviceInfo', {
          type: Sequelize.JSONB,
          defaultValue: {
            browser: null,
            os: null,
            device: null,
            location: null
          }
        });
      }
      
      // Update existing columns to match model
      console.log('📝 更新现有字段类型...');
      
      if (tableDescription.token && tableDescription.token.type !== 'TEXT') {
        await queryInterface.changeColumn('admin_sessions', 'token', {
          type: Sequelize.TEXT,
          allowNull: false,
          unique: true
        });
      }
      
      console.log('✅ admin_sessions 表结构修复完成');
      
    } catch (error) {
      console.error('❌ admin_sessions 表修复失败:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('⏪ 回滚 admin_sessions 表修复...');
    
    try {
      // Remove added columns
      const tableDescription = await queryInterface.describeTable('admin_sessions');
      
      if (tableDescription.refreshToken) {
        await queryInterface.removeColumn('admin_sessions', 'refreshToken');
      }
      
      if (tableDescription.refreshExpiresAt) {
        await queryInterface.removeColumn('admin_sessions', 'refreshExpiresAt');
      }
      
      if (tableDescription.lastActivity) {
        await queryInterface.removeColumn('admin_sessions', 'lastActivity');
      }
      
      if (tableDescription.deviceInfo) {
        await queryInterface.removeColumn('admin_sessions', 'deviceInfo');
      }
      
      // Revert token column type
      await queryInterface.changeColumn('admin_sessions', 'token', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      });
      
      console.log('✅ 回滚完成');
      
    } catch (error) {
      console.error('❌ 回滚失败:', error);
      throw error;
    }
  }
};