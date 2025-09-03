const express = require('express');
const { IncomingCall, UserPhoneNumber } = require('../models');
const auth = require('../middleware/auth');
const { VoiceResponse } = require('twilio').twiml;
const webSocketManager = require('../config/websocket');

const router = express.Router();

// Handle incoming call response from user (accept/decline/ignore)
// DEPRECATED: This endpoint is no longer used. Call acceptance is now handled by /api/twilio/accept-incoming-call
/*
router.post('/respond', auth, async (req, res) => {
  try {
    const { callSid, callId, action } = req.body;
    const userId = req.user.userId;

    console.log(`📞 Call response received: ${action} for call ${callSid} by user ${userId}`);

    // Find the incoming call
    const incomingCall = await IncomingCall.findOne({
      where: {
        id: callId || undefined,
        callSid: callSid,
        userId: userId
      },
      include: [{
        model: UserPhoneNumber,
        as: 'phoneNumber'
      }]
    });

    if (!incomingCall) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Update call record based on user action
    let updateData = {
      userResponse: action,
      userResponseTime: new Date()
    };

    switch (action) {
      case 'accept':
        updateData.status = 'answered';
        updateData.handledBy = 'user';
        updateData.answerTime = new Date();
        break;
      
      case 'decline':
        updateData.status = 'declined';
        updateData.handledBy = 'declined';
        updateData.endTime = new Date();
        break;
      
      case 'ignore':
        updateData.status = 'missed';
        updateData.handledBy = 'voicemail';
        break;
    }

    await incomingCall.update(updateData);

    // Notify other systems about the response
    webSocketManager.notifyCallStatus(userId, {
      callSid,
      callId: incomingCall.id,
      action,
      status: updateData.status,
      timestamp: new Date().toISOString()
    });

    // Generate TwiML response based on action
    const response = new VoiceResponse();

    switch (action) {
      case 'accept':
        // User accepted - this would typically connect to user's device
        // For now, we'll simulate a connection
        response.say('Your call is being connected. Please hold.');
        
        // In a real implementation, you would:
        // 1. Create a conference room
        // 2. Connect the incoming caller to the conference
        // 3. Call the user's device and connect them to the same conference
        // 4. Handle the connection via Twilio Voice SDK on the frontend
        
        response.dial({
          action: `/api/call-response/dial-status/${callSid}`,
          method: 'POST',
          timeout: 30,
          record: 'record-from-ringing'
        });
        break;

      case 'decline':
        // User declined - send to voicemail
        const greeting = incomingCall.phoneNumber?.customGreeting || 
          'The person you are calling is not available. Please leave a message after the beep.';
        
        response.say(greeting);
        response.record({
          action: `/api/incoming-calls/webhook/recording/${callSid}`,
          method: 'POST',
          maxLength: 300,
          playBeep: true,
          transcribe: true
        });
        break;

      case 'ignore':
        // User ignored - continue ringing for a bit, then voicemail
        response.say('Please continue to hold while we try to reach the person you are calling.');
        response.pause({ length: 10 });
        
        const voicemailGreeting = incomingCall.phoneNumber?.customGreeting || 
          'No one is available to take your call. Please leave a message after the beep.';
        
        response.say(voicemailGreeting);
        response.record({
          action: `/api/incoming-calls/webhook/recording/${callSid}`,
          method: 'POST',
          maxLength: 300,
          playBeep: true,
          transcribe: true
        });
        break;
    }

    // Return TwiML response
    res.type('text/xml');
    res.send(response.toString());

    console.log(`✅ Call response processed: ${action} for ${callSid}`);

  } catch (error) {
    console.error('❌ Error processing call response:', error);
    
    // Fallback TwiML
    const response = new VoiceResponse();
    response.say('Sorry, there was an error processing your call. Please try again later.');
    
    res.type('text/xml');
    res.send(response.toString());
  }
});
*/

// Handle dial status for accepted calls
router.post('/dial-status/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;
    const { DialCallStatus, DialCallDuration, RecordingUrl } = req.body;

    console.log(`📞 Dial status for accepted call ${callSid}: ${DialCallStatus}`);

    // Update the call record
    const incomingCall = await IncomingCall.findOne({ where: { callSid } });
    if (incomingCall) {
      let updateData = {
        status: DialCallStatus === 'completed' ? 'completed' : DialCallStatus,
        endTime: new Date()
      };

      if (DialCallStatus === 'completed' && DialCallDuration) {
        updateData.duration = parseInt(DialCallDuration);
      }

      if (RecordingUrl) {
        updateData.hasRecording = true;
        updateData.recordingUrl = RecordingUrl;
      }

      await incomingCall.update(updateData);

      // Notify user about call completion
      webSocketManager.notifyCallStatus(incomingCall.userId, {
        callSid,
        status: updateData.status,
        duration: updateData.duration,
        timestamp: new Date().toISOString()
      });
    }

    const response = new VoiceResponse();
    
    if (DialCallStatus === 'no-answer' || DialCallStatus === 'busy') {
      response.say('The person you are calling is not available. Please leave a message after the beep.');
      response.record({
        action: `/api/incoming-calls/webhook/recording/${callSid}`,
        method: 'POST',
        maxLength: 300,
        playBeep: true,
        transcribe: true
      });
    } else if (DialCallStatus === 'failed') {
      response.say('Sorry, we were unable to connect your call. Please try again later.');
    }

    res.type('text/xml');
    res.send(response.toString());

  } catch (error) {
    console.error('❌ Error handling dial status:', error);
    res.type('text/xml');
    res.send('<Response></Response>');
  }
});

// Get call status for frontend
router.get('/status/:callSid', auth, async (req, res) => {
  try {
    const { callSid } = req.params;
    const userId = req.user.userId;

    const incomingCall = await IncomingCall.findOne({
      where: {
        callSid,
        userId
      },
      include: [{
        model: UserPhoneNumber,
        as: 'phoneNumber',
        attributes: ['phoneNumber', 'callerIdName']
      }]
    });

    if (!incomingCall) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    res.json({
      success: true,
      call: {
        id: incomingCall.id,
        callSid: incomingCall.callSid,
        fromNumber: incomingCall.fromNumber,
        toNumber: incomingCall.toNumber,
        status: incomingCall.status,
        handledBy: incomingCall.handledBy,
        userResponse: incomingCall.userResponse,
        startTime: incomingCall.startTime,
        answerTime: incomingCall.answerTime,
        endTime: incomingCall.endTime,
        duration: incomingCall.duration,
        phoneNumber: incomingCall.phoneNumber
      }
    });

  } catch (error) {
    console.error('❌ Error fetching call status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call status'
    });
  }
});

module.exports = router;