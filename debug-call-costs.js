const { Call, User } = require('./server/models');

async function debugCallCosts() {
  try {
    // 查询所有通话记录
    const allCalls = await Call.findAll({
      attributes: ['id', 'userId', 'direction', 'cost', 'duration', 'createdAt', 'startTime'],
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    
    console.log('=== 最近10条通话记录 ===');
    allCalls.forEach(call => {
      console.log({
        id: call.id,
        userId: call.userId,
        direction: call.direction,
        cost: call.cost,
        duration: call.duration,
        createdAt: call.createdAt,
        startTime: call.startTime
      });
    });
    
    // 统计outbound通话
    const outboundCalls = await Call.count({
      where: { direction: 'outbound' }
    });
    
    const outboundCost = await Call.sum('cost', {
      where: { direction: 'outbound' }
    });
    
    console.log('\n=== Outbound通话统计 ===');
    console.log('Outbound通话数量:', outboundCalls);
    console.log('Outbound通话总费用:', outboundCost);
    
    // 统计所有通话
    const totalCalls = await Call.count();
    const totalCost = await Call.sum('cost');
    
    console.log('\n=== 所有通话统计 ===');
    console.log('总通话数量:', totalCalls);
    console.log('总通话费用:', totalCost);
    
    // 检查createdAt vs startTime
    const callsWithBothDates = await Call.findAll({
      attributes: ['id', 'createdAt', 'startTime'],
      where: {
        direction: 'outbound'
      },
      limit: 5
    });
    
    console.log('\n=== 时间字段对比 (outbound) ===');
    callsWithBothDates.forEach(call => {
      console.log({
        id: call.id,
        createdAt: call.createdAt,
        startTime: call.startTime
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugCallCosts();