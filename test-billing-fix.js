const { Call, Payment, User } = require('./server/models');
const { Op } = require('sequelize');

async function testBillingQueries() {
  try {
    const userId = '4695bc89-2e66-47ed-b704-9bfe62c8a853'; // 从之前的输出中获取的用户ID
    
    // 设置一个月前的日期
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    console.log('=== 测试时间范围 ===');
    console.log('查询开始时间:', oneMonthAgo);
    console.log('当前时间:', new Date());
    
    // 使用 createdAt 查询（原始的billing查询）
    const callChargesCreatedAt = await Call.sum('cost', {
      where: {
        userId,
        createdAt: { [Op.gte]: oneMonthAgo },
        direction: 'outbound'
      }
    });
    
    // 使用 startTime 查询（修复后的查询）
    const callChargesStartTime = await Call.sum('cost', {
      where: {
        userId,
        startTime: { [Op.gte]: oneMonthAgo },
        direction: 'outbound'
      }
    });
    
    // 30天的查询（dashboard使用的）
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const callCharges30Days = await Call.sum('cost', {
      where: {
        userId,
        startTime: { [Op.gte]: thirtyDaysAgo },
        direction: 'outbound'
      }
    });
    
    console.log('\n=== 查询结果对比 ===');
    console.log('使用 createdAt 字段 (原billing查询):', callChargesCreatedAt || 0);
    console.log('使用 startTime 字段 (修复后):', callChargesStartTime || 0);
    console.log('使用 startTime 字段 (30天):', callCharges30Days || 0);
    
    // 查找有时间差异的记录
    const callsWithTimeDiff = await Call.findAll({
      where: {
        userId,
        direction: 'outbound',
        [Op.and]: [
          { startTime: { [Op.gte]: oneMonthAgo } },
          { createdAt: { [Op.lt]: oneMonthAgo } }
        ]
      },
      attributes: ['id', 'cost', 'createdAt', 'startTime']
    });
    
    console.log('\n=== 时间字段有差异的记录 ===');
    console.log('找到', callsWithTimeDiff.length, '条记录的 startTime 在范围内但 createdAt 不在');
    callsWithTimeDiff.forEach(call => {
      console.log({
        id: call.id,
        cost: call.cost,
        createdAt: call.createdAt,
        startTime: call.startTime,
        timeDiff: Math.abs(new Date(call.createdAt) - new Date(call.startTime)) / 1000 / 60 / 60 + ' 小时'
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testBillingQueries();