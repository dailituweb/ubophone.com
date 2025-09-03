const { sequelize } = require('../models');

/**
 * 数据库索引优化脚本
 * 为关键查询添加索引以提升性能
 */

const INDEXES_TO_CREATE = [
  // 通话表索引
  {
    table: 'calls',
    name: 'idx_calls_user_start_time',
    fields: ['userId', 'startTime'],
    description: '用户通话记录按时间查询'
  },
  {
    table: 'calls',
    name: 'idx_calls_user_direction_status',
    fields: ['userId', 'direction', 'status'],
    description: '用户通话记录按方向和状态查询'
  },
  {
    table: 'calls',
    name: 'idx_calls_phone_numbers',
    fields: ['fromNumber', 'toNumber'],
    description: '电话号码查询优化'
  },
  {
    table: 'calls',
    name: 'idx_calls_country_status',
    fields: ['country', 'status'],
    description: '国家和状态查询优化'
  },

  // 支付表索引
  {
    table: 'payments',
    name: 'idx_payments_user_type_status',
    fields: ['userId', 'type', 'status'],
    description: '用户支付记录查询'
  },
  {
    table: 'payments',
    name: 'idx_payments_created_at',
    fields: ['createdAt'],
    description: '支付时间查询优化'
  },

  // 用户电话号码表索引
  {
    table: 'user_phone_numbers',
    name: 'idx_user_phone_numbers_user_status',
    fields: ['userId', 'status'],
    description: '用户电话号码状态查询'
  },
  {
    table: 'user_phone_numbers',
    name: 'idx_user_phone_numbers_phone',
    fields: ['phoneNumber'],
    description: '电话号码查询优化'
  },

  // 优惠券使用表索引
  {
    table: 'coupon_usages',
    name: 'idx_coupon_usages_coupon_user',
    fields: ['couponId', 'userId'],
    description: '优惠券使用情况查询'
  },

  // 来电记录表索引
  {
    table: 'incoming_calls',
    name: 'idx_incoming_calls_user_time',
    fields: ['userId', 'startTime'],
    description: '用户来电记录时间查询'
  },
  {
    table: 'incoming_calls',
    name: 'idx_incoming_calls_phone_numbers',
    fields: ['fromNumber', 'toNumber'],
    description: '来电号码查询优化'
  },

  // 通话录音表索引
  {
    table: 'call_recordings',
    name: 'idx_call_recordings_call_id',
    fields: ['callId'],
    description: '通话录音关联查询'
  },

  // 管理员审计日志索引
  {
    table: 'admin_audit_logs',
    name: 'idx_admin_audit_logs_admin_action',
    fields: ['adminId', 'action'],
    description: '管理员操作日志查询'
  },
  {
    table: 'admin_audit_logs',
    name: 'idx_admin_audit_logs_created_at',
    fields: ['createdAt'],
    description: '审计日志时间查询'
  }
];

async function checkIndexExists(indexName) {
  try {
    const [results] = await sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE indexname = '${indexName}' 
      AND schemaname = 'public'
    `);
    return results.length > 0;
  } catch (error) {
    console.error(`Error checking index ${indexName}:`, error);
    return false;
  }
}

async function createIndex(indexConfig) {
  const { table, name, fields, description } = indexConfig;
  
  try {
    // 检查索引是否已存在
    const exists = await checkIndexExists(name);
    if (exists) {
      console.log(`✅ 索引 ${name} 已存在，跳过创建`);
      return true;
    }

    // 创建索引
    const fieldsStr = fields.map(field => `"${field}"`).join(', ');
    const sql = `CREATE INDEX CONCURRENTLY "${name}" ON "${table}" (${fieldsStr})`;
    
    console.log(`🔨 创建索引: ${name} (${description})`);
    console.log(`   SQL: ${sql}`);
    
    await sequelize.query(sql);
    console.log(`✅ 索引 ${name} 创建成功`);
    return true;
    
  } catch (error) {
    console.error(`❌ 创建索引 ${name} 失败:`, error.message);
    return false;
  }
}

async function analyzeTableStats() {
  console.log('\n📊 分析表统计信息...');
  
  const tables = ['calls', 'payments', 'users', 'user_phone_numbers', 'incoming_calls'];
  
  for (const table of tables) {
    try {
      const [stats] = await sequelize.query(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE tablename = '${table}' 
        AND schemaname = 'public'
        ORDER BY n_distinct DESC
        LIMIT 5
      `);
      
      if (stats.length > 0) {
        console.log(`\n📋 表 ${table} 的列统计信息:`);
        stats.forEach(stat => {
          console.log(`   ${stat.attname}: distinct=${stat.n_distinct}, correlation=${stat.correlation}`);
        });
      }
    } catch (error) {
      console.error(`获取表 ${table} 统计信息失败:`, error.message);
    }
  }
}

async function optimizeDatabase() {
  console.log('🚀 开始数据库索引优化...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  // 创建索引
  for (const indexConfig of INDEXES_TO_CREATE) {
    const success = await createIndex(indexConfig);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // 短暂延迟，避免数据库压力
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📈 索引创建完成:`);
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ❌ 失败: ${failCount}`);
  
  // 分析表统计信息
  await analyzeTableStats();
  
  // 更新表统计信息
  console.log('\n🔄 更新表统计信息...');
  try {
    await sequelize.query('ANALYZE');
    console.log('✅ 表统计信息更新完成');
  } catch (error) {
    console.error('❌ 更新表统计信息失败:', error.message);
  }
  
  console.log('\n🎉 数据库优化完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  optimizeDatabase()
    .then(() => {
      console.log('✅ 数据库索引优化完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 数据库索引优化失败:', error);
      process.exit(1);
    });
}

module.exports = {
  optimizeDatabase,
  createIndex,
  checkIndexExists,
  INDEXES_TO_CREATE
};
