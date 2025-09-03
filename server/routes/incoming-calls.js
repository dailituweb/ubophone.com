const express = require('express');
const { UserPhoneNumber, IncomingCall, User, Call } = require('../models');
const auth = require('../middleware/auth');
const { VoiceResponse } = require('twilio').twiml;
const webSocketManager = require('../config/websocket');

const router = express.Router();

// 新增：处理来电的TwiML端点
router.post('/webhook/process-incoming', async (req, res) => {
  try {
    const { From, To, CallSid, CallStatus } = req.body;
    
    console.log('📞 Processing incoming call:', {
      From,
      To, 
      CallSid,
      CallStatus,
      timestamp: new Date().toISOString()
    });

    res.set({
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-cache'
    });

    const response = new VoiceResponse();

    // 查找哪个用户拥有这个电话号码
    let targetUser = null;
    try {
      const userPhoneNumber = await UserPhoneNumber.findOne({
        where: { phoneNumber: To },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name']
        }]
      });

      if (userPhoneNumber && userPhoneNumber.user) {
        targetUser = userPhoneNumber.user;
        console.log('📞 Found target user for incoming call:', targetUser.email);
      }
    } catch (dbError) {
      console.error('❌ Error finding target user:', dbError);
    }

    if (targetUser) {
      // 有用户，尝试转接或留言
      response.say({
        voice: 'alice',
        language: 'en-US'
      }, `Hello! You've reached ${targetUser.name || 'our service'}. We're processing your call now.`);

      response.pause({ length: 2 });

      // 这里可以添加更复杂的转接逻辑
      // 现在先提供一个友好的消息
      response.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Thank you for calling. Your call is important to us. Please try again later or contact us through our website.');

      response.hangup();
    } else {
      // 没有找到用户，提供通用消息
      response.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Thank you for calling Ubophone. This number is not currently in service. Please check the number and try again.');

      response.hangup();
    }

    const twimlResponse = response.toString();
    console.log('📤 Incoming call TwiML response:', twimlResponse);

    return res.status(200).send(twimlResponse);

  } catch (error) {
    console.error('❌ Error processing incoming call:', error);

    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">We apologize for the technical difficulty. Please try your call again later.</Say>
  <Hangup/>
</Response>`;

    res.set('Content-Type', 'text/xml; charset=utf-8');
    return res.status(200).send(fallbackTwiml);
  }
});

// 兼容 /webhook/dial-status（无 :callSid）
router.post('/webhook/dial-status', async (req, res) => {
  try {
    console.log('📞 Dial status webhook (legacy route):', {
      CallSid: req.body.CallSid,
      DialCallStatus: req.body.DialCallStatus,
      timestamp: new Date().toISOString()
    });

    // 直接调用处理函数，避免递归
    req.params = { callSid: req.body.CallSid };
    await handleDialStatus(req, res);
  } catch (error) {
    console.error('❌ Error in legacy dial status route:', error);
    res.type('text/xml');
    res.send('<Response></Response>');
  }
});

// Twilio来电处理 Webhook - 更新版本使用新的数据模型，优化响应速度
router.post('/webhook/voice', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { From, To, CallSid, CallStatus, Direction } = req.body;
    
    console.log('📞 Incoming call webhook:', {
      From,
      To,
      CallSid,
      CallStatus,
      Direction,
      timestamp: new Date().toISOString()
    });

    // 🚀 立即准备TwiML响应，避免长时间数据库查询导致的超时
    let response = new VoiceResponse();
    let responseReady = false;
    
    // 🚀 异步处理数据库查询，避免阻塞响应
    setImmediate(async () => {
      try {
        await processIncomingCallAsync(From, To, CallSid, CallStatus, Direction);
      } catch (asyncError) {
        console.error('❌ Async incoming call processing failed:', asyncError);
      }
    });
    
    // 查找接收此号码的用户 - 使用超时机制
    let userPhoneNumber = null;
    try {
      const queryPromise = UserPhoneNumber.findOne({
        where: { 
          phoneNumber: To,
          status: 'active'
        },
        include: [{ 
          model: User, 
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'preferences']
        }],
        timeout: 2000 // 2秒超时
      });
      
      userPhoneNumber = await Promise.race([
        queryPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 2000)
        )
      ]);
    } catch (dbError) {
      console.warn('⚠️ Database query failed or timeout:', dbError.message);
      // 继续处理，但没有用户信息
    }
    
    if (userPhoneNumber) {
      console.log('✅ Found user for incoming call:', {
        userId: userPhoneNumber.userId,
        userEmail: userPhoneNumber.user.email,
        phoneNumber: userPhoneNumber.phoneNumber
      });
      
      // 根据用户设置处理来电
      if (userPhoneNumber.forwardingEnabled && userPhoneNumber.forwardingNumber) {
        // 转接到用户手机
        const greeting = userPhoneNumber.customGreeting || 
          'Please hold while we connect you to your phone.';
        
        response.say(greeting);
        response.dial({
          action: `/api/incoming-calls/webhook/dial-status/${CallSid}`,
          method: 'POST',
          timeout: 30,
          record: 'record-from-ringing',
          recordingStatusCallback: `/api/incoming-calls/webhook/dial-status`
        }, userPhoneNumber.forwardingNumber);
      } else {
        // Browser Pickup 模式
        const greeting = userPhoneNumber.customGreeting || 
          'Please hold while we connect you.';
        
        response.say(greeting);
        
        // 使用 Gather 来等待DTMF输入或重定向
        const gather = response.gather({
          action: `/api/incoming-calls/webhook/browser-gather/${CallSid}`,
          method: 'POST',
          timeout: 30,
          numDigits: 1
        });
        
        gather.play('http://com.twilio.music.classical.s3.amazonaws.com/BusyStrings.wav', { loop: 3 });
        response.redirect(`/api/incoming-calls/webhook/browser-timeout/${CallSid}`);
      }
    } else {
      console.log('❌ No active user found for number:', To);
      response.say('This number is not currently in service. Please check the number and try again.');
    }
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Incoming call response sent in ${responseTime}ms`);
    
    res.type('text/xml');
    res.send(response.toString());
    
  } catch (error) {
    console.error('❌ Error handling incoming call:', error);
    const responseTime = Date.now() - startTime;
    console.log(`❌ Error response sent in ${responseTime}ms`);
    
    const response = new VoiceResponse();
    response.say('Sorry, there was an error processing your call. Please try again later.');
    
    res.type('text/xml');
    res.send(response.toString());
  }
});

// 🔄 异步处理来电记录创建，不阻塞webhook响应
async function processIncomingCallAsync(From, To, CallSid, CallStatus, Direction) {
  try {
    // 查找接收此号码的用户
    const userPhoneNumber = await UserPhoneNumber.findOne({
      where: { 
        phoneNumber: To,
        status: 'active'
      },
      include: [{ 
        model: User, 
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName', 'preferences']
      }]
    });
    
    if (!userPhoneNumber) {
      console.log('❌ No user found for async processing:', To);
      return;
    }

    // 创建来电记录
    const incomingCall = await IncomingCall.create({
      userId: userPhoneNumber.userId,
      userPhoneNumberId: userPhoneNumber.id,
      callSid: CallSid,
      fromNumber: From,
      toNumber: To,
      status: 'ringing',
      startTime: new Date()
    });

    console.log('📝 Created incoming call record (async):', {
      id: incomingCall.id,
      fromNumber: From,
      toNumber: To,
      callSid: CallSid
    });

    // 更新号码统计
    try {
      await userPhoneNumber.increment('totalIncomingCalls');
      await userPhoneNumber.update({ lastIncomingCall: new Date() });
    } catch (statsError) {
      console.error('Error updating phone number statistics (async):', statsError);
    }

    // 发送实时通知
    const isUserOnline = webSocketManager.notifyIncomingCall(userPhoneNumber.userId, {
      callId: incomingCall.id,
      callSid: CallSid,
      fromNumber: From,
      toNumber: To,
      callerIdName: userPhoneNumber.callerIdName,
      phoneNumberId: userPhoneNumber.id,
      startTime: incomingCall.startTime
    });

    console.log(`📱 User online status (async): ${isUserOnline ? 'Online - notification sent' : 'Offline - will handle automatically'}`);
    
  } catch (error) {
    console.error('❌ Error in async incoming call processing:', error);
  }
}

// 拨号状态处理函数 - 提取为共用函数，优化响应速度
async function handleDialStatus(req, res) {
  // 🚀 快速响应优化：立即返回TwiML响应，避免Twilio超时
  const startTime = Date.now();
  
  try {
    const { callSid } = req.params;
    const { 
      DialCallStatus, 
      DialCallDuration, 
      RecordingUrl, 
      RecordingSid
    } = req.body;
    
    console.log('📞 Dial status webhook - Fast Response Mode:', {
      callSid,
      DialCallStatus,
      DialCallDuration,
      hasRecording: !!RecordingUrl,
      timestamp: new Date().toISOString()
    });
    
    // 🚀 立即发送TwiML响应，避免超时
    const response = new VoiceResponse();
    
    if (DialCallStatus === 'no-answer' || DialCallStatus === 'busy') {
      response.say('No one is available to take your call right now. Please leave a message after the beep and we will get back to you as soon as possible.');
      response.record({
        action: `/api/incoming-calls/webhook/recording/${callSid}`,
        method: 'POST',
        recordingStatusCallback: `/api/incoming-calls/webhook/dial-status`,
        maxLength: 300,
        playBeep: true,
        transcribe: true
      });
    } else if (DialCallStatus === 'failed') {
      response.say('Sorry, we are unable to connect your call at this time. Please try again later.');
    }
    
    // 🚀 优先发送响应
    res.type('text/xml');
    res.send(response.toString());
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ TwiML response sent in ${responseTime}ms`);
    
    // 🔄 异步处理数据库更新，不阻塞响应
    setImmediate(async () => {
      try {
        await updateCallStatusAsync(callSid, {
          DialCallStatus,
          DialCallDuration,
          RecordingUrl,
          RecordingSid
        });
      } catch (asyncError) {
        console.error('❌ Async database update failed:', asyncError);
      }
    });
    
  } catch (error) {
    console.error('❌ Error handling dial status:', error);
    const responseTime = Date.now() - startTime;
    console.log(`❌ Error response sent in ${responseTime}ms`);
    
    res.type('text/xml');
    res.send('<Response></Response>');
  }
}

// 🔄 异步数据库更新函数
async function updateCallStatusAsync(callSid, data) {
  const { DialCallStatus, DialCallDuration, RecordingUrl, RecordingSid } = data;
  
  try {
    // 更新来电记录 - 简化版本，主要用于转发模式
    const incomingCall = await IncomingCall.findOne({ where: { callSid } });
    if (incomingCall) {
      const duration = parseInt(DialCallDuration) || 0;
    
      // 简化的状态判断 - 主要用于转发到手机的场景
      let finalStatus = 'missed'; // 默认为未接听
      if (DialCallStatus === 'completed' && duration > 0) {
        finalStatus = 'answered';
      } else if (DialCallStatus === 'no-answer' || DialCallStatus === 'busy') {
        finalStatus = 'missed';
      } else if (DialCallStatus === 'failed') {
        finalStatus = 'failed';
      }

      const updateData = {
        status: finalStatus,
        endTime: new Date(),
        duration: duration
      };
      
      if (finalStatus === 'answered') {
        updateData.answerTime = new Date(Date.now() - (duration * 1000));
      }
      
      if (RecordingUrl) {
        updateData.hasRecording = true;
        updateData.recordingUrl = RecordingUrl;
        updateData.recordingSid = RecordingSid;
      }
      
      await incomingCall.update(updateData);
      console.log(`✅ Call status updated: ${finalStatus} (async)`);
      
      // 更新统计数据
      if (finalStatus === 'answered') {
        const userPhoneNumber = await UserPhoneNumber.findByPk(incomingCall.userPhoneNumberId);
        if (userPhoneNumber) {
          try {
            await userPhoneNumber.increment('totalIncomingMinutes', { by: duration });
            await userPhoneNumber.increment('totalAnsweredCalls');
          } catch (minutesError) {
            console.error('Error updating phone number minute statistics:', minutesError);
          }
        }
      }
      
      // 通知前端通话结束
      try {
        webSocketManager.notifyIncomingCallEnded(incomingCall.userId, {
          type: 'incoming_call_ended',
          callSid: callSid,
          status: finalStatus,
          reason: 'call_completed',
          fromNumber: incomingCall.fromNumber,
          toNumber: incomingCall.toNumber
        });
      } catch (wsError) {
        console.error('❌ Failed to notify frontend of call end:', wsError);
      }
      
      // 处理语音信箱状态
      if (DialCallStatus === 'no-answer' || DialCallStatus === 'busy') {
        await incomingCall.update({ 
          handledBy: 'voicemail',
          status: 'missed' 
        });
      }
    }
  } catch (error) {
    console.error('❌ Error in async database update:', error);
  }
}

// 处理拨号状态回调路由
router.post('/webhook/dial-status/:callSid', handleDialStatus);

// 处理录音完成回调
router.post('/webhook/recording/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;
    const { RecordingUrl, RecordingDuration, RecordingSid, TranscriptionText } = req.body;
    
    console.log('🎙️ Recording completed for call:', callSid, {
      duration: RecordingDuration,
      hasTranscription: !!TranscriptionText
    });
    
    // 更新来电记录
    const incomingCall = await IncomingCall.findOne({ where: { callSid } });
    if (incomingCall) {
      await incomingCall.update({
        endTime: new Date(),
        hasVoicemail: true,
        voicemailUrl: RecordingUrl,
        voicemailSid: RecordingSid,
        voicemailTranscription: TranscriptionText || null
      });
      
      // 🔧 移除：不再在Call表中创建来电记录，避免出现在dashboard
      // 语音邮件记录只保存在IncomingCall表中
      
      console.log('✅ Updated incoming call with voicemail info');
    }
    
    const response = new VoiceResponse();
    response.say('Thank you for your message. We will get back to you soon. Goodbye.');
    
    res.type('text/xml');
    res.send(response.toString());
    
  } catch (error) {
    console.error('❌ Error handling recording completion:', error);
    res.type('text/xml');
    res.send('<Response></Response>');
  }
});

// 处理录音状态回调
router.post('/webhook/recording-status', async (req, res) => {
  try {
    const { CallSid, RecordingStatus, RecordingUrl, RecordingSid } = req.body;
    
    console.log('🎙️ Recording status update:', {
      CallSid,
      RecordingStatus,
      RecordingSid
    });
    
    // 可以在这里处理录音状态更新
    // 例如：录音失败、录音完成等状态
    
    res.type('text/xml');
    res.send('<Response></Response>');
    
  } catch (error) {
    console.error('❌ Error handling recording status:', error);
    res.type('text/xml');
    res.send('<Response></Response>');
  }
});

// 获取用户的来电历史（使用新的IncomingCall模型）
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, phoneNumberId } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {
      userId: req.user.userId
    };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (phoneNumberId) {
      whereClause.userPhoneNumberId = phoneNumberId;
    }
    
    const calls = await IncomingCall.findAndCountAll({
      where: whereClause,
      order: [['startTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: UserPhoneNumber,
          as: 'phoneNumber',
          attributes: ['phoneNumber', 'callerIdName']
        }
      ]
    });
    
    // 格式化响应数据
    const formattedCalls = calls.rows.map(call => ({
      id: call.id,
      callSid: call.callSid,
      fromNumber: call.fromNumber,
      toNumber: call.toNumber,
      toPhoneNumberInfo: call.phoneNumber,
      status: call.status,
      handledBy: call.handledBy,
      startTime: call.startTime,
      answerTime: call.answerTime,
      endTime: call.endTime,
      duration: call.duration,
      ringDuration: call.ringDuration,
      hasRecording: call.hasRecording,
      hasVoicemail: call.hasVoicemail,
      voicemailTranscription: call.voicemailTranscription,
      isSpam: call.isSpam,
      isBlocked: call.isBlocked,
      userNotes: call.userNotes,
      callerLocation: call.callerLocation
    }));
    
    res.json({
      success: true,
      calls: formattedCalls,
      pagination: {
        total: calls.count,
        totalPages: Math.ceil(calls.count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching incoming call history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call history'
    });
  }
});

// 更新来电备注
router.put('/:id/notes', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, isSpam, isBlocked } = req.body;
    
    const incomingCall = await IncomingCall.findOne({
      where: {
        id,
        userId: req.user.userId
      }
    });
    
    if (!incomingCall) {
      return res.status(404).json({
        success: false,
        message: 'Incoming call not found'
      });
    }
    
    const updateData = {};
    if (notes !== undefined) updateData.userNotes = notes;
    if (isSpam !== undefined) updateData.isSpam = isSpam;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
    
    await incomingCall.update(updateData);
    
    res.json({
      success: true,
      message: 'Call notes updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating call notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update call notes'
    });
  }
});

// 辅助函数：检查营业时间
function checkBusinessHours(businessHours) {
  if (!businessHours || !businessHours.enabled) {
    return true; // 如果未启用营业时间，总是可用
  }
  
  const now = new Date();
  const timezone = businessHours.timezone || 'UTC';
  
  try {
    // 获取当前时间在指定时区的信息
    const currentDay = now.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: timezone 
    }).toLowerCase();
    
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false,
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const daySettings = businessHours.hours[currentDay];
    if (!daySettings || !daySettings.enabled) {
      return false;
    }
    
    return currentTime >= daySettings.start && currentTime <= daySettings.end;
  } catch (error) {
    console.error('❌ Error checking business hours:', error);
    return true; // 出错时默认为营业时间
  }
}

// 处理浏览器Gather响应
router.post('/webhook/browser-gather/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;
    const { Digits } = req.body;
    
    console.log(`📞 Browser gather response for call ${callSid}, digits:`, Digits);
    
    // 查找来电记录
    const incomingCall = await IncomingCall.findOne({ where: { callSid } });
    
    if (!incomingCall) {
      const response = new VoiceResponse();
      response.say('Call not found.');
      response.hangup();
      return res.type('text/xml').send(response.toString());
    }
    
    const response = new VoiceResponse();
    
    // 继续等待用户在浏览器中的操作
    // 重新进入gather循环
    const gather = response.gather({
      action: `/api/incoming-calls/webhook/browser-gather/${callSid}`,
      method: 'POST',
      timeout: 30,
      numDigits: 1
    });
    
    gather.play('http://com.twilio.music.classical.s3.amazonaws.com/BusyStrings.wav', { loop: 3 });
    
    // 超时后转到timeout处理
    response.redirect(`/api/incoming-calls/webhook/browser-timeout/${callSid}`);
    
    res.type('text/xml');
    res.send(response.toString());
    
  } catch (error) {
    console.error('❌ Error handling browser gather:', error);
    res.type('text/xml');
    res.send('<Response></Response>');
  }
});

// 处理浏览器接听超时 - 优化响应速度
router.post('/webhook/browser-timeout/:callSid', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { callSid } = req.params;

    console.log('⏰ Browser pickup timeout for call:', callSid);
    
    // 🚀 立即准备TwiML响应
    const response = new VoiceResponse();
    
    // 🚀 优先发送快速响应，避免阻塞
    setImmediate(async () => {
      try {
        // 查找来电记录
        const incomingCall = await IncomingCall.findOne({ where: { callSid } });
        
        if (incomingCall) {
          // 查找用户电话号码设置
          const userPhoneNumber = await UserPhoneNumber.findOne({
            where: { id: incomingCall.userPhoneNumberId }
          });
          
          if (userPhoneNumber && userPhoneNumber.voicemailEnabled) {
            // 更新状态
            await incomingCall.update({ 
              handledBy: 'voicemail',
              status: 'no-answer'
            });
          } else {
            // 更新状态
            await incomingCall.update({ 
              status: 'missed'
            });
          }
        }
      } catch (asyncError) {
        console.error('❌ Async timeout processing failed:', asyncError);
      }
    });
    
    // 🚀 立即返回TwiML响应
    response.say('No one answered. Please leave a message after the beep.');
    response.record({
      action: `/api/incoming-calls/webhook/recording/${callSid}`,
      method: 'POST',
      recordingStatusCallback: `/api/incoming-calls/webhook/dial-status`,
      maxLength: 300,
      playBeep: true,
      transcribe: true
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Browser timeout response sent in ${responseTime}ms`);
    
    res.type('text/xml');
    res.send(response.toString());
    
  } catch (error) {
    console.error('❌ Error handling browser timeout:', error);
    const responseTime = Date.now() - startTime;
    console.log(`❌ Timeout error response sent in ${responseTime}ms`);

    // 确保返回有效的TwiML响应
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const response = new VoiceResponse();
    response.say('Service temporarily unavailable. Please try again later.');
    response.hangup();

    res.type('text/xml');
    res.send(response.toString());
  }
});

// 处理用户在浏览器中的接听/拒绝操作
router.post('/webhook/browser-answer/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;
    const { action } = req.body; // 'answer' 或 'reject'
    
    console.log(`📞 User browser action for call ${callSid}:`, action);
    
    // 查找来电记录
    const incomingCall = await IncomingCall.findOne({ where: { callSid } });
    
    if (!incomingCall) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    if (action === 'answer') {
      console.log('✅ User accepted call - redirecting Twilio call');
      
      // 使用Twilio REST API重定向正在进行的通话
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      try {
        // 重定向通话到接听处理端点，并设置好后续的状态回调
        await twilio.calls(callSid).update({
          url: `${process.env.BASE_URL || 'https://ubophone.com'}/api/incoming-calls/webhook/browser-connected/${callSid}`,
          method: 'POST',
          // 关键修复：确保通话结束后，Twilio会调用我们的状态更新webhook
          statusCallback: `${process.env.BASE_URL || 'https://ubophone.com'}/api/incoming-calls/webhook/dial-status/${callSid}`,
          statusCallbackMethod: 'POST',
          statusCallbackEvent: ['completed'] // 只在通话完成时回调
        });
        
        // 更新状态
        await incomingCall.update({ 
          status: 'answered',
          answerTime: new Date(),
          handledBy: 'user'
        });
        
        console.log('📞 Call redirected to browser connection endpoint');
        res.json({ success: true, message: 'Call answered successfully' });
        
      } catch (twilioError) {
        console.error('❌ Twilio API error:', twilioError);
        res.status(500).json({ error: 'Failed to answer call' });
      }
      
    } else if (action === 'reject') {
      console.log('❌ User rejected call - redirecting to voicemail');
      
      // 使用Twilio REST API重定向到拒绝处理
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      try {
        await twilio.calls(callSid).update({
          url: `${process.env.BASE_URL || 'https://ubophone.com'}/api/incoming-calls/webhook/browser-rejected/${callSid}`,
          method: 'POST'
        });
        
        // 更新状态
        await incomingCall.update({ 
          status: 'rejected',
          handledBy: 'user'
        });
        
        res.json({ success: true, message: 'Call rejected successfully' });
        
      } catch (twilioError) {
        console.error('❌ Twilio API error:', twilioError);
        res.status(500).json({ error: 'Failed to reject call' });
      }
    }
    
  } catch (error) {
    console.error('❌ Error handling browser answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 处理用户接听后的通话连接
router.post('/webhook/browser-connected/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;
    
    console.log('🔗 Browser connected for call:', callSid);
    
    const response = new VoiceResponse();
    
    // 播放连接成功提示
    response.say('You are now connected. The caller can hear you.');
    
    // 这里可以设置录音或其他功能
    response.record({
      action: `/api/incoming-calls/webhook/recording/${callSid}`,
      method: 'POST',
      recordingStatusCallback: `/api/incoming-calls/webhook/dial-status`,
      maxLength: 3600, // 1小时通话时间
      playBeep: false,
      transcribe: false
    });
    
    res.type('text/xml');
    res.send(response.toString());
    
  } catch (error) {
    console.error('❌ Error handling browser connection:', error);
    res.type('text/xml');
    res.send('<Response></Response>');
  }
});

// 处理用户拒绝后的语音信箱
router.post('/webhook/browser-rejected/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;
    
    console.log('❌ Browser rejected for call:', callSid);
    
    // 查找来电记录和用户设置
    const incomingCall = await IncomingCall.findOne({ where: { callSid } });
    
    if (incomingCall) {
      const userPhoneNumber = await UserPhoneNumber.findOne({
        where: { id: incomingCall.userPhoneNumberId }
      });
      
      const response = new VoiceResponse();
      
      if (userPhoneNumber && userPhoneNumber.voicemailEnabled) {
        response.say('The call has been declined. Please leave a message after the beep.');
        response.record({
          action: `/api/incoming-calls/webhook/recording/${callSid}`,
          method: 'POST',
          recordingStatusCallback: `/api/incoming-calls/webhook/dial-status`,
          maxLength: 300,
          playBeep: true,
          transcribe: true
        });
      } else {
        response.say('The call has been declined. Thank you for calling. Goodbye.');
        response.hangup();
      }
      
      res.type('text/xml');
      res.send(response.toString());
    } else {
      res.type('text/xml');
      res.send('<Response></Response>');
    }
    
  } catch (error) {
    console.error('❌ Error handling browser rejection:', error);
    res.type('text/xml');
    res.send('<Response></Response>');
  }
});

module.exports = router;