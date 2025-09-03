const { Sequelize } = require('sequelize');

// 确保DATABASE_URL环境变量存在
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// PostgreSQL连接配置
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: true // 生产环境必须验证SSL证书
    } : false // 开发环境可以不使用SSL
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  timezone: '+00:00'
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL database connected successfully!');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  Op: Sequelize.Op
}; 