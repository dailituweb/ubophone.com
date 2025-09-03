'use strict';

/**
 * Migration: Create Missing Core Tables
 * 
 * This migration creates all the missing tables that are critical for the application:
 * - users
 * - calls  
 * - call_recordings
 * - payments
 * - admins (if not exists)
 * - admin_roles (if not exists)
 * - admin_sessions (if not exists)
 * - admin_audit_logs (if not exists)
 * - user_phone_numbers (if not exists)
 * - incoming_calls (if not exists)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔧 Creating missing core tables...');
      
      // ==================== CREATE USERS TABLE ====================
      const usersExists = await queryInterface.tableExists('users');
      if (!usersExists) {
        console.log('📝 Creating users table...');
        await queryInterface.createTable('users', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          firstName: {
            type: Sequelize.STRING,
            allowNull: false
          },
          lastName: {
            type: Sequelize.STRING,
            allowNull: false
          },
          email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate: {
              isEmail: true
            }
          },
          password: {
            type: Sequelize.STRING,
            allowNull: false
          },
          phoneNumber: {
            type: Sequelize.STRING,
            allowNull: true
          },
          isVerified: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          verificationToken: {
            type: Sequelize.STRING,
            allowNull: true
          },
          resetPasswordToken: {
            type: Sequelize.STRING,
            allowNull: true
          },
          resetPasswordExpires: {
            type: Sequelize.DATE,
            allowNull: true
          },
          avatar: {
            type: Sequelize.STRING,
            allowNull: true
          },
          timezone: {
            type: Sequelize.STRING,
            defaultValue: 'UTC'
          },
          language: {
            type: Sequelize.STRING,
            defaultValue: 'en'
          },
          credits: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          },
          isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
          },
          lastLogin: {
            type: Sequelize.DATE,
            allowNull: true
          },
          loginCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          preferences: {
            type: Sequelize.JSONB,
            defaultValue: {
              notifications: true,
              theme: 'light',
              autoAnswer: false
            }
          },
          socialProviders: {
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
        
        // Create indexes for users
        await queryInterface.addIndex('users', ['email'], { unique: true, transaction });
        await queryInterface.addIndex('users', ['phoneNumber'], { transaction });
        await queryInterface.addIndex('users', ['isActive'], { transaction });
        await queryInterface.addIndex('users', ['createdAt'], { transaction });
      }
      
      // ==================== CREATE CALLS TABLE ====================
      const callsExists = await queryInterface.tableExists('calls');
      if (!callsExists) {
        console.log('📝 Creating calls table...');
        await queryInterface.createTable('calls', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          userId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          callSid: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          },
          fromNumber: {
            type: Sequelize.STRING,
            allowNull: false
          },
          toNumber: {
            type: Sequelize.STRING,
            allowNull: false
          },
          direction: {
            type: Sequelize.ENUM('inbound', 'outbound'),
            allowNull: false
          },
          status: {
            type: Sequelize.ENUM('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled', 'answered', 'missed'),
            allowNull: false,
            defaultValue: 'initiated'
          },
          duration: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          cost: {
            type: Sequelize.DECIMAL(10, 4),
            defaultValue: 0.0000
          },
          currency: {
            type: Sequelize.STRING(3),
            defaultValue: 'USD'
          },
          startedAt: {
            type: Sequelize.DATE,
            allowNull: true
          },
          answeredAt: {
            type: Sequelize.DATE,
            allowNull: true
          },
          endedAt: {
            type: Sequelize.DATE,
            allowNull: true
          },
          recordingUrl: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          recordingSid: {
            type: Sequelize.STRING,
            allowNull: true
          },
          metadata: {
            type: Sequelize.JSONB,
            defaultValue: {}
          },
          errorCode: {
            type: Sequelize.STRING,
            allowNull: true
          },
          errorMessage: {
            type: Sequelize.TEXT,
            allowNull: true
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
        
        // Create indexes for calls
        await queryInterface.addIndex('calls', ['userId'], { transaction });
        await queryInterface.addIndex('calls', ['callSid'], { unique: true, transaction });
        await queryInterface.addIndex('calls', ['fromNumber'], { transaction });
        await queryInterface.addIndex('calls', ['toNumber'], { transaction });
        await queryInterface.addIndex('calls', ['direction'], { transaction });
        await queryInterface.addIndex('calls', ['status'], { transaction });
        await queryInterface.addIndex('calls', ['createdAt'], { transaction });
        await queryInterface.addIndex('calls', ['startedAt'], { transaction });
      }
      
      // ==================== CREATE CALL_RECORDINGS TABLE ====================
      const callRecordingsExists = await queryInterface.tableExists('call_recordings');
      if (!callRecordingsExists) {
        console.log('📝 Creating call_recordings table...');
        await queryInterface.createTable('call_recordings', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          callId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'calls',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          userId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          recordingSid: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          },
          recordingUrl: {
            type: Sequelize.TEXT,
            allowNull: false
          },
          duration: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          fileSize: {
            type: Sequelize.BIGINT,
            allowNull: true
          },
          format: {
            type: Sequelize.STRING,
            defaultValue: 'mp3'
          },
          status: {
            type: Sequelize.ENUM('processing', 'completed', 'failed', 'deleted'),
            defaultValue: 'processing'
          },
          transcription: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          isEncrypted: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          encryptionKey: {
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
        
        // Create indexes for call_recordings
        await queryInterface.addIndex('call_recordings', ['callId'], { transaction });
        await queryInterface.addIndex('call_recordings', ['userId'], { transaction });
        await queryInterface.addIndex('call_recordings', ['recordingSid'], { unique: true, transaction });
        await queryInterface.addIndex('call_recordings', ['status'], { transaction });
        await queryInterface.addIndex('call_recordings', ['createdAt'], { transaction });
      }
      
      // ==================== CREATE PAYMENTS TABLE ====================
      const paymentsExists = await queryInterface.tableExists('payments');
      if (!paymentsExists) {
        console.log('📝 Creating payments table...');
        await queryInterface.createTable('payments', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          userId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          stripePaymentIntentId: {
            type: Sequelize.STRING,
            allowNull: true,
            unique: true
          },
          stripeChargeId: {
            type: Sequelize.STRING,
            allowNull: true
          },
          amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
          },
          currency: {
            type: Sequelize.STRING(3),
            defaultValue: 'USD'
          },
          status: {
            type: Sequelize.ENUM('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'),
            defaultValue: 'pending'
          },
          paymentMethod: {
            type: Sequelize.STRING,
            allowNull: true
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          credits: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
          },
          metadata: {
            type: Sequelize.JSONB,
            defaultValue: {}
          },
          refundAmount: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          },
          refundReason: {
            type: Sequelize.STRING,
            allowNull: true
          },
          paidAt: {
            type: Sequelize.DATE,
            allowNull: true
          },
          refundedAt: {
            type: Sequelize.DATE,
            allowNull: true
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
        
        // Create indexes for payments
        await queryInterface.addIndex('payments', ['userId'], { transaction });
        await queryInterface.addIndex('payments', ['stripePaymentIntentId'], { unique: true, transaction });
        await queryInterface.addIndex('payments', ['status'], { transaction });
        await queryInterface.addIndex('payments', ['createdAt'], { transaction });
        await queryInterface.addIndex('payments', ['paidAt'], { transaction });
      }
      
      // ==================== CREATE USER_PHONE_NUMBERS TABLE ====================
      const userPhoneNumbersExists = await queryInterface.tableExists('user_phone_numbers');
      if (!userPhoneNumbersExists) {
        console.log('📝 Creating user_phone_numbers table...');
        await queryInterface.createTable('user_phone_numbers', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          userId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          phoneNumber: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          },
          friendlyName: {
            type: Sequelize.STRING,
            allowNull: true
          },
          twilioSid: {
            type: Sequelize.STRING,
            allowNull: true
          },
          country: {
            type: Sequelize.STRING(2),
            allowNull: true
          },
          region: {
            type: Sequelize.STRING,
            allowNull: true
          },
          isPrimary: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
          },
          capabilities: {
            type: Sequelize.JSONB,
            defaultValue: {
              voice: true,
              sms: false,
              mms: false
            }
          },
          monthlyFee: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          },
          totalSeconds: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          totalIncomingSeconds: {
            type: Sequelize.INTEGER,
            allowNull: false,  
            defaultValue: 0
          },
          totalAnsweredCalls: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          totalCalls: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          lastUsedAt: {
            type: Sequelize.DATE,
            allowNull: true
          },
          purchasedAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          },
          expiresAt: {
            type: Sequelize.DATE,
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
        
        // Create indexes for user_phone_numbers
        await queryInterface.addIndex('user_phone_numbers', ['userId'], { transaction });
        await queryInterface.addIndex('user_phone_numbers', ['phoneNumber'], { unique: true, transaction });
        await queryInterface.addIndex('user_phone_numbers', ['isPrimary'], { transaction });
        await queryInterface.addIndex('user_phone_numbers', ['isActive'], { transaction });
        await queryInterface.addIndex('user_phone_numbers', ['createdAt'], { transaction });
      }
      
      // ==================== CREATE INCOMING_CALLS TABLE ====================
      const incomingCallsExists = await queryInterface.tableExists('incoming_calls');
      if (!incomingCallsExists) {
        console.log('📝 Creating incoming_calls table...');
        await queryInterface.createTable('incoming_calls', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          callSid: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          },
          userId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          fromNumber: {
            type: Sequelize.STRING,
            allowNull: false
          },
          toNumber: {
            type: Sequelize.STRING,
            allowNull: false
          },
          status: {
            type: Sequelize.ENUM('ringing', 'in-progress', 'completed', 'busy', 'no-answer', 'failed', 'canceled', 'missed'),
            defaultValue: 'ringing'
          },
          duration: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          recordingUrl: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          recordingSid: {
            type: Sequelize.STRING,
            allowNull: true
          },
          isForwarded: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          forwardedTo: {
            type: Sequelize.STRING,
            allowNull: true
          },
          answeredAt: {
            type: Sequelize.DATE,
            allowNull: true
          },
          endedAt: {
            type: Sequelize.DATE,
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
        
        // Create indexes for incoming_calls
        await queryInterface.addIndex('incoming_calls', ['callSid'], { unique: true, transaction });
        await queryInterface.addIndex('incoming_calls', ['userId'], { transaction });
        await queryInterface.addIndex('incoming_calls', ['fromNumber'], { transaction });
        await queryInterface.addIndex('incoming_calls', ['toNumber'], { transaction });
        await queryInterface.addIndex('incoming_calls', ['status'], { transaction });
        await queryInterface.addIndex('incoming_calls', ['createdAt'], { transaction });
      }
      
      await transaction.commit();
      console.log('🎉 All missing core tables created successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('⏪ Rolling back table creation...');
      
      // Drop tables in reverse order to handle foreign key constraints
      const tablesToDrop = [
        'call_recordings',
        'incoming_calls', 
        'payments',
        'calls',
        'user_phone_numbers',
        'users'
      ];
      
      for (const tableName of tablesToDrop) {
        const tableExists = await queryInterface.tableExists(tableName);
        if (tableExists) {
          await queryInterface.dropTable(tableName, { transaction });
          console.log(`✅ Dropped table: ${tableName}`);
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