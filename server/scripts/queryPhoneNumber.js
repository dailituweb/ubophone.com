const { sequelize } = require('../config/database');

async function queryPhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    console.log('Usage: node queryPhoneNumber.js [phone_number]');
    console.log('Example: node queryPhoneNumber.js +16318955550');
    process.exit(1);
  }
  
  try {
    console.log(`🔍 Querying database for phone number: ${phoneNumber}`);
    console.log('=' .repeat(60));
    
    // Prepare different formats of the phone number to search
    const searchNumbers = [
      phoneNumber,
      phoneNumber.replace('+', ''),
      phoneNumber.replace(/[^\d]/g, ''), // Remove all non-digit characters
      '+' + phoneNumber.replace(/[^\d]/g, ''), // Add + prefix to digits only
    ];
    
    console.log(`📋 Searching for variations: ${searchNumbers.join(', ')}`);
    
    // Query user_phone_numbers table
    console.log('\n1. USER PHONE NUMBERS TABLE:');
    const [userPhones] = await sequelize.query(`
      SELECT 
        upn.id,
        upn."userId",
        upn."phoneNumber",
        upn.type,
        upn.status,
        upn."twilioSid",
        upn.capabilities,
        upn."purchaseDate",
        upn."expiryDate",
        upn."monthlyFee",
        upn."isDefaultCallerId",
        upn.locality,
        upn.region,
        upn."isoCountry",
        upn."forwardingEnabled",
        upn."forwardingNumber",
        upn."voicemailEnabled",
        upn."totalIncomingCalls",
        upn."totalIncomingMinutes",
        upn."lastIncomingCall",
        upn."createdAt",
        upn."updatedAt",
        u.username,
        u.email,
        u.balance,
        u."firstName",
        u."lastName",
        u."isActive" as user_active
      FROM user_phone_numbers upn
      LEFT JOIN users u ON upn."userId" = u.id
      WHERE upn."phoneNumber" = ANY($1);
    `, {
      bind: [searchNumbers]
    });
    
    if (userPhones.length > 0) {
      console.log(`✅ Found ${userPhones.length} record(s):`);
      userPhones.forEach((phone, index) => {
        console.log(`\n   Record ${index + 1}:`);
        console.log(`     • ID: ${phone.id}`);
        console.log(`     • Phone Number: ${phone.phoneNumber}`);
        console.log(`     • User ID: ${phone.userId}`);
        console.log(`     • User: ${phone.username || 'N/A'} (${phone.email || 'N/A'})`);
        console.log(`     • User Name: ${phone.firstName || 'N/A'} ${phone.lastName || 'N/A'}`);
        console.log(`     • User Balance: $${phone.balance || '0'}`);
        console.log(`     • User Active: ${phone.user_active ? 'Yes' : 'No'}`);
        console.log(`     • Type: ${phone.type}`);
        console.log(`     • Status: ${phone.status}`);
        console.log(`     • Twilio SID: ${phone.twilioSid || 'N/A'}`);
        console.log(`     • Capabilities: ${JSON.stringify(phone.capabilities)}`);
        console.log(`     • Purchase Date: ${phone.purchaseDate}`);
        console.log(`     • Expiry Date: ${phone.expiryDate || 'Never'}`);
        console.log(`     • Monthly Fee: $${phone.monthlyFee}`);
        console.log(`     • Default Caller ID: ${phone.isDefaultCallerId ? 'Yes' : 'No'}`);
        console.log(`     • Location: ${phone.locality || 'N/A'}, ${phone.region || 'N/A'} (${phone.isoCountry || 'N/A'})`);
        console.log(`     • Forwarding: ${phone.forwardingEnabled ? 'Enabled' : 'Disabled'}`);
        console.log(`     • Forwarding Number: ${phone.forwardingNumber || 'N/A'}`);
        console.log(`     • Voicemail: ${phone.voicemailEnabled ? 'Enabled' : 'Disabled'}`);
        console.log(`     • Total Incoming Calls: ${phone.totalIncomingCalls}`);
        console.log(`     • Total Incoming Minutes: ${phone.totalIncomingMinutes}`);
        console.log(`     • Last Incoming Call: ${phone.lastIncomingCall || 'Never'}`);
        console.log(`     • Created: ${phone.createdAt}`);
        console.log(`     • Updated: ${phone.updatedAt}`);
      });
    } else {
      console.log('❌ No records found in user_phone_numbers table');
    }
    
    // Query calls table
    console.log('\n2. CALLS TABLE:');
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
        u.username,
        u.email
      FROM calls c
      LEFT JOIN users u ON c."userId" = u.id
      WHERE c."fromNumber" = ANY($1) OR c."toNumber" = ANY($1)
      ORDER BY c."createdAt" DESC
      LIMIT 20;
    `, {
      bind: [searchNumbers]
    });
    
    if (calls.length > 0) {
      console.log(`✅ Found ${calls.length} call(s) (showing last 20):`);
      calls.forEach((call, index) => {
        console.log(`\n   Call ${index + 1}:`);
        console.log(`     • ID: ${call.id}`);
        console.log(`     • Call SID: ${call.callSid}`);
        console.log(`     • User: ${call.username || 'N/A'} (${call.email || 'N/A'})`);
        console.log(`     • From: ${call.fromNumber} → To: ${call.toNumber}`);
        console.log(`     • Direction: ${call.direction}`);
        console.log(`     • Status: ${call.status}`);
        console.log(`     • Duration: ${call.duration}s (${Math.round(call.duration/60*100)/100} min)`);
        console.log(`     • Cost: $${call.cost}`);
        console.log(`     • Rate: $${call.rate}/min`);
        console.log(`     • Country: ${call.country || 'N/A'}`);
        console.log(`     • Start Time: ${call.startTime}`);
        console.log(`     • End Time: ${call.endTime || 'N/A'}`);
        console.log(`     • Created: ${call.createdAt}`);
      });
    } else {
      console.log('❌ No calls found involving this number');
    }
    
    // Query incoming_calls table
    console.log('\n3. INCOMING CALLS TABLE:');
    const [incomingCalls] = await sequelize.query(`
      SELECT 
        ic.id,
        ic."callSid",
        ic."userId",
        ic."fromNumber",
        ic."toNumber",
        ic.status,
        ic.direction,
        ic.duration,
        ic."ringDuration",
        ic."handledBy",
        ic."forwardedTo",
        ic.cost,
        ic.rate,
        ic."callerLocation",
        ic."hasRecording",
        ic."hasVoicemail",
        ic."userNotified",
        ic."isSpam",
        ic."isBlocked",
        ic."startTime",
        ic."answerTime",
        ic."endTime",
        ic."createdAt",
        u.username,
        u.email
      FROM incoming_calls ic
      LEFT JOIN users u ON ic."userId" = u.id
      WHERE ic."fromNumber" = ANY($1) OR ic."toNumber" = ANY($1)
      ORDER BY ic."createdAt" DESC
      LIMIT 20;
    `, {
      bind: [searchNumbers]
    });
    
    if (incomingCalls.length > 0) {
      console.log(`✅ Found ${incomingCalls.length} incoming call(s) (showing last 20):`);
      incomingCalls.forEach((call, index) => {
        console.log(`\n   Incoming Call ${index + 1}:`);
        console.log(`     • ID: ${call.id}`);
        console.log(`     • Call SID: ${call.callSid}`);
        console.log(`     • User: ${call.username || 'N/A'} (${call.email || 'N/A'})`);
        console.log(`     • From: ${call.fromNumber} → To: ${call.toNumber}`);
        console.log(`     • Status: ${call.status}`);
        console.log(`     • Direction: ${call.direction}`);
        console.log(`     • Duration: ${call.duration}s (${Math.round(call.duration/60*100)/100} min)`);
        console.log(`     • Ring Duration: ${call.ringDuration}s`);
        console.log(`     • Handled By: ${call.handledBy || 'N/A'}`);
        console.log(`     • Forwarded To: ${call.forwardedTo || 'N/A'}`);
        console.log(`     • Cost: $${call.cost}`);
        console.log(`     • Rate: $${call.rate}/min`);
        console.log(`     • Caller Location: ${JSON.stringify(call.callerLocation)}`);
        console.log(`     • Has Recording: ${call.hasRecording ? 'Yes' : 'No'}`);
        console.log(`     • Has Voicemail: ${call.hasVoicemail ? 'Yes' : 'No'}`);
        console.log(`     • User Notified: ${call.userNotified ? 'Yes' : 'No'}`);
        console.log(`     • Is Spam: ${call.isSpam ? 'Yes' : 'No'}`);
        console.log(`     • Is Blocked: ${call.isBlocked ? 'Yes' : 'No'}`);
        console.log(`     • Start Time: ${call.startTime}`);
        console.log(`     • Answer Time: ${call.answerTime || 'N/A'}`);
        console.log(`     • End Time: ${call.endTime || 'N/A'}`);
        console.log(`     • Created: ${call.createdAt}`);
      });
    } else {
      console.log('❌ No incoming calls found involving this number');
    }
    
    // Check if this number is set as default caller ID
    console.log('\n4. DEFAULT CALLER ID CHECK:');
    const [defaultCallerIds] = await sequelize.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u."defaultCallerId",
        upn."phoneNumber"
      FROM users u
      JOIN user_phone_numbers upn ON u."defaultCallerId" = upn.id
      WHERE upn."phoneNumber" = ANY($1);
    `, {
      bind: [searchNumbers]
    });
    
    if (defaultCallerIds.length > 0) {
      console.log(`✅ This number is set as default caller ID for ${defaultCallerIds.length} user(s):`);
      defaultCallerIds.forEach((user, index) => {
        console.log(`\n   User ${index + 1}:`);
        console.log(`     • User ID: ${user.id}`);
        console.log(`     • Username: ${user.username}`);
        console.log(`     • Email: ${user.email}`);
        console.log(`     • Phone Number: ${user.phoneNumber}`);
      });
    } else {
      console.log('❌ This number is not set as default caller ID for any user');
    }
    
    // Check contacts table
    console.log('\n5. CONTACTS TABLE:');
    const [contacts] = await sequelize.query(`
      SELECT 
        c.id,
        c."userId",
        c.name,
        c.phone,
        c.email,
        c.country,
        c.company,
        c."lastCalled",
        c.notes,
        c."createdAt",
        u.username as user_username,
        u.email as user_email
      FROM contacts c
      LEFT JOIN users u ON c."userId" = u.id
      WHERE c.phone = ANY($1)
      ORDER BY c."createdAt" DESC
      LIMIT 10;
    `, {
      bind: [searchNumbers]
    });
    
    if (contacts.length > 0) {
      console.log(`✅ Found ${contacts.length} contact(s):`);
      contacts.forEach((contact, index) => {
        console.log(`\n   Contact ${index + 1}:`);
        console.log(`     • ID: ${contact.id}`);
        console.log(`     • Name: ${contact.name}`);
        console.log(`     • Phone: ${contact.phone}`);
        console.log(`     • Email: ${contact.email || 'N/A'}`);
        console.log(`     • Country: ${contact.country || 'N/A'}`);
        console.log(`     • Company: ${contact.company || 'N/A'}`);
        console.log(`     • Last Called: ${contact.lastCalled || 'Never'}`);
        console.log(`     • Notes: ${contact.notes || 'N/A'}`);
        console.log(`     • Owner: ${contact.user_username || 'N/A'} (${contact.user_email || 'N/A'})`);
        console.log(`     • Created: ${contact.createdAt}`);
      });
    } else {
      console.log('❌ No contacts found with this phone number');
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log(`✅ Database query completed for ${phoneNumber}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error querying database:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

// Get phone number from command line argument
const phoneNumber = process.argv[2];
queryPhoneNumber(phoneNumber);