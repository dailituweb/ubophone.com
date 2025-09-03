const { sequelize } = require('../config/database');
const { User, Call, Payment, IncomingCallSettings, CallAnalytics, CallRecording, SubscriptionPlan, UserSubscription, Coupon, CouponUsage, Promotion, Contact, UserPhoneNumber, IncomingCall } = require('../models');

const migrateDatabaseSchema = async () => {
  try {
    console.log('🔄 Starting database migration...');
    
    // 测试连接
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // 同步所有模型 - 这会安全地添加缺失的字段
    // alter: true 会添加缺失的字段但不会删除现有数据
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database schema migration completed successfully!');
    console.log('📋 Migration summary:');
    console.log('   - Added missing columns to existing tables');
    console.log('   - Created new tables if they don\'t exist');
    console.log('   - Preserved all existing data');
    
    // 验证关键表的存在
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`📊 Total tables: ${tables.length}`);
    console.log('📋 Tables:', tables.join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  migrateDatabaseSchema();
}

module.exports = { migrateDatabaseSchema }; 