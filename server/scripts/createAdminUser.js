#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const { Admin, sequelize } = require('../models');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function createAdminUser() {
  try {
    console.log('🔑 Creating admin user...\n');

    // 检查是否已存在管理员
    const existingAdmin = await Admin.findOne({ 
      where: { username: 'admin' } 
    });

    if (existingAdmin) {
      console.log('❌ Admin user already exists');
      console.log('📧 Username: admin');
      console.log('🔑 Use existing password or delete the admin first');
      return;
    }

    // 生成密码哈希
    const password = 'admin123456'; // 临时密码，首次登录后应该修改
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建管理员账户
    const admin = await Admin.create({
      username: 'admin',
      email: 'admin@ubophone.com',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      permissions: {
        dashboard: ['read'],
        users: ['read', 'write'],
        calls: ['read', 'write'],
        finance: ['read', 'write'],
        system: ['read', 'write'],
        admin: ['read', 'write']
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Username: admin');
    console.log('🔑 Password: admin123456');
    console.log('🎯 Role: super_admin');
    console.log('🆔 ID:', admin.id);
    console.log('\n⚠️  IMPORTANT: Please change the default password after first login!');
    console.log('🌐 Admin login URL: http://localhost:3001/admin/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('💡 Admin user might already exist');
    }
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// 运行脚本
createAdminUser(); 