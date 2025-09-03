const { UserPhoneNumber, Call, sequelize } = require('../models');

async function verifyDurationForNumber(phoneNumber) {
  try {
    console.log(`Verifying call duration for number: ${phoneNumber}`);

    // 1. Find the UserPhoneNumber record
    const phoneRecord = await UserPhoneNumber.findOne({
      where: { phoneNumber: phoneNumber }
    });

    if (!phoneRecord) {
      console.log('Phone number not found in the database.');
      return;
    }

    console.log(`Found phone number record. Stored statistics:`);
    console.log(`- Total Incoming Calls: ${phoneRecord.totalIncomingCalls}`);
    console.log(`- Total Incoming Minutes: ${phoneRecord.totalIncomingMinutes}`);
    console.log('---');

    // 2. Find all 'answered' calls for this number
    const answeredCalls = await Call.findAll({
      where: {
        toNumber: phoneNumber,
        status: ['completed', 'answered'], 
        direction: 'inbound'
      }
    });

    if (answeredCalls.length === 0) {
      console.log('No answered inbound calls found for this number.');
      return;
    }

    // 3. Sum up the actual durations in seconds
    let totalSeconds = 0;
    answeredCalls.forEach(call => {
      totalSeconds += call.duration || 0;
    });

    const totalMinutesFromSeconds = totalSeconds / 60;

    // 4. Sum up the durations using the Math.ceil() logic
    let totalMinutesCeiled = 0;
    answeredCalls.forEach(call => {
        if (call.duration > 0) {
            totalMinutesCeiled += Math.ceil((call.duration || 0) / 60);
        }
    });


    console.log('Calculated Statistics from raw call data:');
    console.log(`- Total Answered Calls Found: ${answeredCalls.length}`);
    console.log(`- Total Actual Duration: ${totalSeconds} seconds`);
    console.log(`- Total Actual Duration: ${totalMinutesFromSeconds.toFixed(2)} minutes`);
    console.log(`- Total Duration (using ceil logic): ${totalMinutesCeiled} minutes`);

    console.log('\n--- Comparison ---');
    console.log(`Stored Minutes: ${phoneRecord.totalIncomingMinutes}`);
    console.log(`Calculated Minutes (Ceil logic): ${totalMinutesCeiled}`);
    console.log(`Calculated Minutes (Actual): ${totalMinutesFromSeconds.toFixed(2)}`);

    if (phoneRecord.totalIncomingMinutes == totalMinutesCeiled) {
        console.log('\nConclusion: The stored value matches the calculation using the `Math.ceil()` method. The high value is due to rounding up every call to the next full minute.');
    } else {
        console.log('\nConclusion: Discrepancy found. The stored value does NOT match the `Math.ceil()` calculation. There might be another issue in the update logic.');
    }


  } catch (error) {
    console.error('An error occurred during verification:', error);
  } finally {
    await sequelize.close();
  }
}

const phoneNumberToVerify = '+14844970174';
verifyDurationForNumber(phoneNumberToVerify); 