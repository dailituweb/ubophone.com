const { Call, User } = require('../models');
const { Op } = require('sequelize');

async function searchCallHistory() {
  try {
    console.log('🔍 Searching for phone number: 320535120');
    
    // Search in both toNumber and fromNumber fields
    const calls = await Call.findAll({
      where: {
        [Op.or]: [
          { toNumber: { [Op.like]: '%320535120%' } },
          { fromNumber: { [Op.like]: '%320535120%' } },
          { toNumber: '320535120' },
          { fromNumber: '320535120' },
          { toNumber: '+320535120' },
          { fromNumber: '+320535120' }
        ]
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`\n📞 Found ${calls.length} call(s) with phone number 320535120:\n`);

    if (calls.length > 0) {
      calls.forEach((call, index) => {
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
        console.log(`  User: ${call.user?.username || 'N/A'} (${call.user?.email || 'N/A'})`);
        console.log(`  Created: ${call.createdAt}`);
        console.log('---');
      });
    } else {
      console.log('No calls found with this phone number.');
      
      // Let's also check if there are any calls at all
      const totalCalls = await Call.count();
      console.log(`\nTotal calls in database: ${totalCalls}`);
      
      if (totalCalls > 0) {
        // Show some sample call numbers
        const sampleCalls = await Call.findAll({
          limit: 5,
          order: [['createdAt', 'DESC']],
          attributes: ['toNumber', 'fromNumber', 'createdAt']
        });
        
        console.log('\nSample phone numbers in database:');
        sampleCalls.forEach(call => {
          console.log(`  From: ${call.fromNumber} → To: ${call.toNumber} (${call.createdAt})`);
        });
      }
    }

    // Also search for partial matches
    console.log('\n🔍 Searching for partial matches containing "320535120"...');
    const partialMatches = await Call.findAll({
      where: {
        [Op.or]: [
          { toNumber: { [Op.like]: '%320%' } },
          { toNumber: { [Op.like]: '%535%' } },
          { toNumber: { [Op.like]: '%120%' } }
        ]
      },
      limit: 10,
      attributes: ['toNumber', 'fromNumber', 'createdAt']
    });

    if (partialMatches.length > 0) {
      console.log(`Found ${partialMatches.length} partial matches:`);
      partialMatches.forEach(call => {
        console.log(`  From: ${call.fromNumber} → To: ${call.toNumber}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error searching call history:', error);
    process.exit(1);
  }
}

// Run the search
searchCallHistory();