const { sequelize } = require('../config/database');

async function fixCountryField() {
  try {
    console.log('🔧 Starting country field migration...');
    
    // 检查当前字段状态
    console.log('📋 Checking current field definition...');
    const [currentSchema] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'calls' AND column_name = 'country';
    `);
    
    if (currentSchema.length > 0) {
      console.log('🔍 Current country field info:', currentSchema[0]);
    } else {
      console.log('❌ Country field not found in calls table');
      return;
    }
    
    // 执行字段长度修改
    console.log('⚡ Updating country field to VARCHAR(100)...');
    await sequelize.query(`
      ALTER TABLE "calls" 
      ALTER COLUMN "country" TYPE VARCHAR(100);
    `);
    
    console.log('✅ Country field successfully updated to VARCHAR(100)');
    
    // 验证修改结果
    console.log('🔍 Verifying field update...');
    const [updatedSchema] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'calls' AND column_name = 'country';
    `);
    
    console.log('📊 Updated country field info:', updatedSchema[0]);
    
    // 检查现有数据
    const [dataCheck] = await sequelize.query(`
      SELECT COUNT(*) as total_records, 
             COUNT(CASE WHEN country IS NOT NULL THEN 1 END) as records_with_country,
             COUNT(CASE WHEN LENGTH(country) > 2 THEN 1 END) as long_country_names
      FROM "calls";
    `);
    
    console.log('📈 Data impact analysis:', dataCheck[0]);
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', {
      message: error.message,
      name: error.name,
      detail: error.detail,
      constraint: error.constraint
    });
    
    // 提供回滚建议
    console.log('🔄 If you need to rollback, run:');
    console.log('ALTER TABLE "calls" ALTER COLUMN "country" TYPE VARCHAR(2);');
    
  } finally {
    console.log('🔌 Closing database connection...');
    await sequelize.close();
  }
}

// 执行迁移
console.log('🚀 Starting database field migration...');
fixCountryField();