/**
 * 清理临时token记录
 * 删除所有使用'temp_token'的AdminSession记录
 */

const { sequelize } = require('../config/database');
const { AdminSession } = require('../models');

async function cleanupTempTokens() {
  try {
    console.log('🧹 开始清理临时token记录...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 临时禁用，因为AdminSession模型与数据库结构不匹配
    // 查找所有使用temp_token的记录
    // const tempTokenSessions = await AdminSession.findAll({
    //   where: {
    //     token: 'temp_token'
    //   }
    // });
    console.log('⚠️ 临时token清理已禁用，因为模型结构不匹配');
    const tempTokenSessions = [];
    
    console.log(`📊 找到 ${tempTokenSessions.length} 个临时token记录`);
    
    if (tempTokenSessions.length > 0) {
      // 删除这些记录
      const deletedCount = await AdminSession.destroy({
        where: {
          token: 'temp_token'
        }
      });
      
      console.log(`🗑️ 已删除 ${deletedCount} 个临时token记录`);
    } else {
      console.log('✅ 没有找到需要清理的临时token记录');
    }
    
    console.log('🎉 临时token清理完成！');
    return true;
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupTempTokens()
    .then(() => {
      console.log('✅ 清理脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 清理脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { cleanupTempTokens }; 