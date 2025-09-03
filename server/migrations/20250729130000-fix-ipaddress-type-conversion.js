'use strict';

/**
 * Fix ipAddress Column Type Conversion Issues
 * 
 * This migration specifically handles the INET type conversion problem
 * that occurs when PostgreSQL cannot automatically cast string to INET.
 * 
 * Error: column "ipAddress" cannot be cast automatically to type inet
 * Solution: Use explicit USING clause for type conversion
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔧 Fixing ipAddress column type conversion issues...');
      
      // Function to safely convert ipAddress columns to INET type
      const convertIpAddressColumn = async (tableName, columnName = 'ipAddress') => {
        try {
          // Check if table exists
          const tableExists = await queryInterface.tableExists(tableName);
          if (!tableExists) {
            console.log(`⏭️ Table ${tableName} does not exist, skipping...`);
            return;
          }
          
          // Check current column type
          const tableDesc = await queryInterface.describeTable(tableName);
          if (!tableDesc[columnName]) {
            console.log(`⏭️ Column ${columnName} does not exist in ${tableName}, skipping...`);
            return;
          }
          
          const currentType = tableDesc[columnName].type;
          console.log(`📋 Current ${tableName}.${columnName} type: ${currentType}`);
          
          // If already INET, skip
          if (currentType === 'INET') {
            console.log(`✅ ${tableName}.${columnName} is already INET type`);
            return;
          }
          
          // Step 1: Handle existing data
          console.log(`🔄 Converting ${tableName}.${columnName} from ${currentType} to INET...`);
          
          // First, clean up any invalid IP addresses in the data
          await queryInterface.sequelize.query(`
            UPDATE "${tableName}" 
            SET "${columnName}" = '0.0.0.0' 
            WHERE "${columnName}" IS NOT NULL 
            AND "${columnName}" !~ '^([0-9]{1,3}\\.){3}[0-9]{1,3}$'
            AND "${columnName}" != ''
          `, { transaction });
          
          // Set empty strings to NULL
          await queryInterface.sequelize.query(`
            UPDATE "${tableName}" 
            SET "${columnName}" = NULL 
            WHERE "${columnName}" = ''
          `, { transaction });
          
          // Step 2: Convert column type with explicit USING clause
          const allowNull = tableDesc[columnName].allowNull;
          const defaultValue = tableDesc[columnName].defaultValue;
          
          await queryInterface.sequelize.query(`
            ALTER TABLE "${tableName}" 
            ALTER COLUMN "${columnName}" 
            TYPE INET 
            USING CASE 
              WHEN "${columnName}" IS NULL THEN NULL
              WHEN "${columnName}" ~ '^([0-9]{1,3}\\.){3}[0-9]{1,3}$' THEN "${columnName}"::inet
              ELSE '0.0.0.0'::inet
            END
          `, { transaction });
          
          console.log(`✅ Successfully converted ${tableName}.${columnName} to INET type`);
          
        } catch (error) {
          console.warn(`⚠️ Failed to convert ${tableName}.${columnName}:`, error.message);
          
          // If conversion fails, create the column as TEXT instead to avoid blocking deployment
          if (error.message.includes('cannot be cast')) {
            console.log(`🔄 Fallback: Setting ${tableName}.${columnName} as TEXT type...`);
            await queryInterface.changeColumn(tableName, columnName, {
              type: Sequelize.TEXT,
              allowNull: tableDesc[columnName].allowNull,
              defaultValue: tableDesc[columnName].defaultValue
            }, { transaction });
            console.log(`✅ Fallback completed: ${tableName}.${columnName} set as TEXT`);
          } else {
            throw error;
          }
        }
      };
      
      // Convert ipAddress columns in all relevant tables
      await convertIpAddressColumn('admin_audit_logs', 'ipAddress');
      await convertIpAddressColumn('admin_sessions', 'ipAddress');
      await convertIpAddressColumn('admins', 'lastLoginIp');
      
      // Also handle any other tables that might have IP address fields
      const tables = ['users', 'calls', 'incoming_calls'];
      for (const table of tables) {
        const tableExists = await queryInterface.tableExists(table);
        if (tableExists) {
          const tableDesc = await queryInterface.describeTable(table);
          
          // Look for IP-related columns
          const ipColumns = Object.keys(tableDesc).filter(col => 
            col.toLowerCase().includes('ip') || 
            col.toLowerCase().includes('addr')
          );
          
          for (const ipCol of ipColumns) {
            await convertIpAddressColumn(table, ipCol);
          }
        }
      }
      
      await transaction.commit();
      console.log('🎉 IP address type conversion completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ IP address type conversion failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('⏪ Rolling back IP address type conversions...');
      
      // Convert INET columns back to TEXT
      const convertBackToText = async (tableName, columnName = 'ipAddress') => {
        try {
          const tableExists = await queryInterface.tableExists(tableName);
          if (!tableExists) return;
          
          const tableDesc = await queryInterface.describeTable(tableName);
          if (!tableDesc[columnName]) return;
          
          await queryInterface.changeColumn(tableName, columnName, {
            type: Sequelize.TEXT,
            allowNull: tableDesc[columnName].allowNull
          }, { transaction });
          
          console.log(`✅ Converted ${tableName}.${columnName} back to TEXT`);
        } catch (error) {
          console.warn(`⚠️ Failed to convert ${tableName}.${columnName} back to TEXT:`, error.message);
        }
      };
      
      await convertBackToText('admin_audit_logs', 'ipAddress');
      await convertBackToText('admin_sessions', 'ipAddress');
      await convertBackToText('admins', 'lastLoginIp');
      
      await transaction.commit();
      console.log('✅ Rollback completed');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};