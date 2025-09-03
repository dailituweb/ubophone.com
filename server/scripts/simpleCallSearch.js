const { sequelize } = require('../config/database');

async function searchPhoneNumber() {
  try {
    console.log('🔍 Searching for phone number: 320535120');
    
    // First, let's check the table structure
    const [tableInfo] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'calls'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Calls table structure:');
    tableInfo.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Now search for the phone number
    const [results] = await sequelize.query(`
      SELECT id, "callSid", "fromNumber", "toNumber", direction, status, 
             duration, cost, country, "startTime", "createdAt"
      FROM calls
      WHERE "toNumber" LIKE '%320535120%' 
         OR "fromNumber" LIKE '%320535120%'
         OR "toNumber" = '320535120'
         OR "fromNumber" = '320535120'
         OR "toNumber" = '+320535120'
         OR "fromNumber" = '+320535120'
      ORDER BY "createdAt" DESC;
    `);
    
    console.log(`\n📞 Found ${results.length} call(s) with phone number 320535120:\n`);
    
    if (results.length > 0) {
      results.forEach((call, index) => {
        console.log(`Call ${index + 1}:`);
        console.log(`  ID: ${call.id}`);
        console.log(`  Call SID: ${call.callSid}`);
        console.log(`  From: ${call.fromNumber}`);
        console.log(`  To: ${call.toNumber}`);
        console.log(`  Direction: ${call.direction}`);
        console.log(`  Status: ${call.status}`);
        console.log(`  Duration: ${call.duration}s`);
        console.log(`  Cost: $${call.cost}`);
        console.log(`  Country: ${call.country || 'N/A'}`);
        console.log(`  Start Time: ${call.startTime}`);
        console.log(`  Created: ${call.createdAt}`);
        console.log('---');
      });
    } else {
      console.log('No calls found with this phone number.');
      
      // Get total count and sample numbers
      const [[{ count }]] = await sequelize.query(`SELECT COUNT(*) as count FROM calls;`);
      console.log(`\nTotal calls in database: ${count}`);
      
      if (count > 0) {
        const [sampleCalls] = await sequelize.query(`
          SELECT "toNumber", "fromNumber", "createdAt"
          FROM calls
          ORDER BY "createdAt" DESC
          LIMIT 10;
        `);
        
        console.log('\nSample phone numbers in database:');
        sampleCalls.forEach(call => {
          console.log(`  From: ${call.fromNumber} → To: ${call.toNumber} (${new Date(call.createdAt).toLocaleString()})`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

// Run the search
searchPhoneNumber();