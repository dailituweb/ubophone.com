const { Call, Payment, User } = require('./server/models');
const { Op } = require('sequelize');

async function debugBillingDetailed() {
  try {
    // 获取所有用户
    const users = await User.findAll({
      attributes: ['id', 'username', 'email'],
      limit: 10
    });
    
    console.log('=== 用户列表 ===');
    for (const user of users) {
      console.log(`用户: ${user.username} (${user.id})`);
      
      // 计算该用户的通话费用
      const totalCost = await Call.sum('cost', {
        where: {
          userId: user.id,
          direction: 'outbound'
        }
      });
      
      const lastMonthCostCreatedAt = await Call.sum('cost', {
        where: {
          userId: user.id,
          direction: 'outbound',
          createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      });
      
      const lastMonthCostStartTime = await Call.sum('cost', {
        where: {
          userId: user.id,
          direction: 'outbound',
          startTime: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      });
      
      console.log(`  - 总费用: ${totalCost || 0}`);
      console.log(`  - 最近30天费用 (createdAt): ${lastMonthCostCreatedAt || 0}`);
      console.log(`  - 最近30天费用 (startTime): ${lastMonthCostStartTime || 0}`);
      
      // 获取最近的通话
      const recentCall = await Call.findOne({
        where: {
          userId: user.id,
          direction: 'outbound'
        },
        order: [['startTime', 'DESC']]
      });
      
      if (recentCall) {
        console.log(`  - 最近通话: ${recentCall.startTime} (费用: ${recentCall.cost})`);
      }
      
      console.log('');
    }
    
    // 检查所有时间范围选项
    console.log('=== 时间范围测试 ===');
    const testUserId = '4695bc89-2e66-47ed-b704-9bfe62c8a853';
    const ranges = ['today', 'week', 'month', 'year', 'all'];
    
    for (const range of ranges) {
      let startDate = new Date();
      switch (range) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      const costStartTime = await Call.sum('cost', {
        where: {
          userId: testUserId,
          startTime: { [Op.gte]: startDate },
          direction: 'outbound'
        }
      });
      
      const costCreatedAt = await Call.sum('cost', {
        where: {
          userId: testUserId,
          createdAt: { [Op.gte]: startDate },
          direction: 'outbound'
        }
      });
      
      console.log(`${range}: startTime=${costStartTime || 0}, createdAt=${costCreatedAt || 0}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugBillingDetailed();