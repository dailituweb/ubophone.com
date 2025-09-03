const { sequelize } = require('../config/database');

async function listAllCalls() {
  try {
    console.log('📞 Listing all calls in the database:\n');
    
    // Get all calls with user info
    const [calls] = await sequelize.query(`
      SELECT 
        c.id,
        c."callSid",
        c."userId",
        c."fromNumber",
        c."toNumber",
        c.direction,
        c.status,
        c.duration,
        c.cost,
        c.rate,
        c.country,
        c."startTime",
        c."endTime",
        c."createdAt",
        c."updatedAt",
        u.username,
        u.email
      FROM calls c
      LEFT JOIN users u ON c."userId" = u.id
      ORDER BY c."createdAt" DESC;
    `);
    
    console.log(`Total calls found: ${calls.length}\n`);
    
    calls.forEach((call, index) => {
      console.log(`Call ${index + 1}:`);
      console.log(`  ID: ${call.id}`);
      console.log(`  Call SID: ${call.callSid}`);
      console.log(`  User: ${call.username || 'N/A'} (${call.email || 'N/A'})`);
      console.log(`  From: ${call.fromNumber}`);
      console.log(`  To: ${call.toNumber}`);
      console.log(`  Direction: ${call.direction}`);
      console.log(`  Status: ${call.status}`);
      console.log(`  Duration: ${call.duration}s`);
      console.log(`  Cost: $${call.cost}`);
      console.log(`  Rate: $${call.rate}/min`);
      console.log(`  Country: ${call.country || 'N/A'}`);
      console.log(`  Start Time: ${call.startTime}`);
      console.log(`  End Time: ${call.endTime || 'N/A'}`);
      console.log(`  Created: ${call.createdAt}`);
      console.log(`  Updated: ${call.updatedAt}`);
      console.log('---');
    });
    
    // Also show user balance
    console.log('\n💰 User Balances:');
    const [users] = await sequelize.query(`
      SELECT username, email, balance
      FROM users
      ORDER BY "createdAt" DESC;
    `);
    
    users.forEach(user => {
      console.log(`  ${user.username} (${user.email}): $${user.balance}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the listing
listAllCalls();