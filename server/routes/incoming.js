const express = require('express');
const router = express.Router();
const { IncomingCallSettings, Call, User, CallRecording, UserPhoneNumber, IncomingCall } = require('../models');
const auth = require('../middleware/auth');
const { VoiceResponse } = require('twilio').twiml;
const webSocketManager = require('../config/websocket');

// 获取用户的来电设置
router.get('/settings', auth, async (req, res) => {
  try {
    let settings = await IncomingCallSettings.findOne({
      where: { userId: req.user.userId }
    });
    
    // 如果没有设置，创建默认设置
    if (!settings) {
      settings = await IncomingCallSettings.create({
        userId: req.user.userId,
        twilioNumber: '+1234567890', // 临时号码，实际应该从Twilio分配
        forwardingEnabled: true,
        voicemailEnabled: true,
        autoAnswer: false
      });
    }
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching incoming call settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

// 更新来电设置
router.put('/settings', auth, async (req, res) => {
  try {
    const {
      forwardingEnabled,
      forwardingNumber,
      voicemailEnabled,
      autoAnswer,
      businessHours,
      customGreeting
    } = req.body;
    
    const [settings, created] = await IncomingCallSettings.findOrCreate({
      where: { userId: req.user.userId },
      defaults: {
        userId: req.user.userId,
        twilioNumber: '+1234567890', // 临时号码
        forwardingEnabled,
        forwardingNumber,
        voicemailEnabled,
        autoAnswer,
        businessHours,
        customGreeting
      }
    });
    
    if (!created) {
      await settings.update({
        forwardingEnabled,
        forwardingNumber,
        voicemailEnabled,
        autoAnswer,
        businessHours,
        customGreeting
      });
    }
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error updating incoming call settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// Twilio来电处理 Webhook
router.post('/webhook/voice', async (req, res) => {
  console.log('📞 =================================');
  console.log('📞 Incoming call webhook triggered');
  console.log('📞 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📞 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('📞 =================================');
  
  // 立即设置正确的响应头
  res.set('Content-Type', 'text/xml; charset=utf-8');
  
  try {
    const { From, To, CallSid, CallStatus } = req.body;
    
    // 使用VoiceResponse构建TwiML，但保持简单
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    // 如果没有目标号码，返回测试消息
    if (!To) {
      console.log('📞 No target number found, using test message');
      twiml.say('Hello, this is a test call from Ubophone.');
      const xmlResponse = twiml.toString();
      console.log('📤 Generated TwiML (no target):', xmlResponse);
      return res.status(200).send(xmlResponse);
    }
    
    // 查找电话号码记录，但不让错误阻断通话
    let phoneNumberRecord = null;
    try {
      // 处理 URL 编码问题：Twilio 发送的 + 号会变成空格
      const normalizedTo = To.startsWith(' ') ? `+${To.trim()}` : To;
      console.log('📞 Normalized phone number:', normalizedTo);
      
      phoneNumberRecord = await UserPhoneNumber.findOne({
        where: { phoneNumber: normalizedTo }
      });
      console.log('📞 Phone number lookup result:', phoneNumberRecord ? 'Found' : 'Not found');
    } catch (dbError) {
      console.warn('⚠️ Database error during phone lookup:', dbError.message);
      // 继续处理，不中断
    }
    
    if (!phoneNumberRecord) {
      console.log('📞 No phone number record, using default message');
      twiml.say('This number is not configured. Please contact support.');
      const xmlResponse = twiml.toString();
      console.log('📤 Generated TwiML (not configured):', xmlResponse);
      return res.status(200).send(xmlResponse);
    }
    
    // 🔧 创建IncomingCall记录（来电记录只存储在IncomingCall表中）
    let incomingCallRecord = null;
    try {
      // 创建IncomingCall记录（用于/incoming-calls页面显示）
      incomingCallRecord = await IncomingCall.create({
        userId: phoneNumberRecord.userId,
        userPhoneNumberId: phoneNumberRecord.id,
        callSid: CallSid,
        fromNumber: From,
        toNumber: To,
        status: 'ringing',
        direction: 'inbound',
        startTime: new Date()
      });
      
      console.log('✅ IncomingCall record created successfully');
      
      // 🔔 通知用户有来电
      console.log('📞 Notifying user about incoming call via WebSocket');
      try {
        const callData = {
          callId: null, // 来电不创建Call记录
          incomingCallId: incomingCallRecord.id,
          callSid: CallSid,
          fromNumber: From,
          toNumber: To,
          callerIdName: null, // 可以从Twilio获取
          phoneNumberId: phoneNumberRecord.id,
          startTime: new Date().toISOString(),
          timeout: 30000
        };
        
        const userIsOnline = webSocketManager.notifyIncomingCall(phoneNumberRecord.userId, callData);
        console.log(`🔔 WebSocket notification sent to user ${phoneNumberRecord.userId}: ${userIsOnline ? 'delivered' : 'user offline'}`);
      } catch (wsError) {
        console.error('❌ WebSocket notification failed:', wsError);
        // 不阻断通话流程
      }
    } catch (callError) {
      console.warn('⚠️ Failed to create incoming call record, continuing:', callError.message);
    }
    
    // 🔧 根据配置处理通话（支持转发和浏览器接听）
    if (phoneNumberRecord.forwardingEnabled && phoneNumberRecord.forwardingNumber) {
      console.log('📞 Forwarding to:', phoneNumberRecord.forwardingNumber);
      twiml.say('Please hold while we connect you.');
      twiml.dial(phoneNumberRecord.forwardingNumber);
    } else if (!phoneNumberRecord.forwardingEnabled) {
      // 浏览器接听模式 - 将来电放入队列等待
      console.log('📞 Browser pickup mode - enqueueing call');
      twiml.say('Please wait while we connect you to an agent.');
      
      // 使用队列功能，让来电等待
      const baseUrl = (process.env.APP_URL || process.env.BASE_URL || 'https://ubophone.com').replace(/\/$/, '');
const waitMusicTwiMLBin = 'https://handler.twilio.com/twiml/EH20f1ffc44c5c21c099f043fa8e695ddc';

twiml.enqueue({
  waitUrl: waitMusicTwiMLBin,
  waitUrlMethod: 'GET',    // TwiML Bins 推荐用 GET
  action: `${baseUrl}/api/incoming-calls/webhook/queue-status/${CallSid}`,
  method: 'POST'
}, `queue_${phoneNumberRecord.userId}`);
 // 为每个用户创建独立队列
    } else if (phoneNumberRecord.voicemailEnabled) {
      console.log('📞 Directing to voicemail');
      twiml.say(phoneNumberRecord.customGreeting || 'Please leave a message after the beep.');
      twiml.record({
        maxLength: 300,
        playBeep: true
      });
    } else {
      console.log('📞 No call handling configured');
      twiml.say('Thank you for calling. This number is not configured to receive calls at this time.');
    }
    
    const xmlResponse = twiml.toString();
    console.log('📤 Final TwiML response:', xmlResponse);
    return res.status(200).send(xmlResponse);
    
  } catch (error) {
    console.error('❌ Critical error in webhook:', error);
    console.error('❌ Error stack:', error.stack);
    
    // 紧急降级：返回合法的错误TwiML
    res.set('Content-Type', 'text/xml');
    const emergencyTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, an error occurred. Please try again later.</Say>
</Response>`;
    
    console.log('🚨 Emergency response:', emergencyTwiML);
    return res.status(200).send(emergencyTwiML);
  }
});

// 处理拨号状态回调
router.post('/webhook/dial-status/:callSid', async (req, res) => {
  console.log('📞 Dial status webhook received:', req.body);
  
  // 立即设置正确的响应头
  res.set('Content-Type', 'text/xml; charset=utf-8');
  
  try {
    const { callSid } = req.params;
    const { DialCallStatus, DialCallDuration, RecordingUrl } = req.body;
    
    console.log('📞 Dial status details:', {
      callSid,
      DialCallStatus,
      DialCallDuration,
      RecordingUrl
    });
    
    // 更新通话记录（不阻塞响应）
    try {
      const call = await Call.findOne({ where: { callSid } });
      if (call) {
        await call.update({
          status: DialCallStatus === 'completed' ? 'completed' : DialCallStatus,
          duration: parseInt(DialCallDuration) || 0,
          endTime: new Date()
        });
        console.log('✅ Call record updated for dial status');
      }
    } catch (dbError) {
      console.warn('⚠️ Failed to update call record:', dbError.message);
    }
    
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    if (DialCallStatus === 'no-answer' || DialCallStatus === 'busy') {
      console.log('📞 Call not answered/busy, offering voicemail');
      twiml.say('No one is available to take your call. Please leave a message after the beep.');
      twiml.record({
        maxLength: 300,
        playBeep: true
      });
    } else if (DialCallStatus === 'failed') {
      console.log('📞 Call failed');
      twiml.say('Sorry, we are unable to connect your call at this time. Please try again later.');
    } else {
      console.log('📞 Call completed normally');
      // 对于成功的通话，不需要额外的TwiML指令
    }
    
    const xmlResponse = twiml.toString();
    console.log('📤 Dial status TwiML response:', xmlResponse);
    return res.status(200).send(xmlResponse);
    
  } catch (error) {
    console.error('❌ Error in dial status webhook:', error);
    
    // 返回空的有效TwiML
    const fallbackTwiML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    console.log('🚨 Fallback dial status TwiML:', fallbackTwiML);
    return res.status(200).send(fallbackTwiML);
  }
});

// 处理录音完成回调
router.post('/webhook/recording/:callSid', async (req, res) => {
  console.log('📞 Recording webhook received:', req.body);
  
  // 立即设置正确的响应头
  res.set('Content-Type', 'text/xml; charset=utf-8');
  
  try {
    const { callSid } = req.params;
    const { RecordingUrl, RecordingDuration } = req.body;
    
    console.log('📞 Recording completed for call:', callSid, 'Duration:', RecordingDuration);
    
    // 更新通话记录（不阻塞响应）
    try {
      const call = await Call.findOne({ where: { callSid } });
      if (call) {
        await call.update({
          status: 'completed',
          endTime: new Date()
        });
        console.log('✅ Call record updated for recording completion');
      }
    } catch (dbError) {
      console.warn('⚠️ Failed to update call record after recording:', dbError.message);
    }
    
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    twiml.say('Thank you for your message. Goodbye.');
    
    const xmlResponse = twiml.toString();
    console.log('📤 Recording completion TwiML response:', xmlResponse);
    return res.status(200).send(xmlResponse);
    
  } catch (error) {
    console.error('❌ Error in recording webhook:', error);
    
    // 返回简单的感谢消息
    const fallbackTwiML = '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you. Goodbye.</Say></Response>';
    console.log('🚨 Fallback recording TwiML:', fallbackTwiML);
    return res.status(200).send(fallbackTwiML);
  }
});

// 获取来电历史 - 修复：应该查询IncomingCall表而不是Call表
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
    
    // 🔧 修复：查询IncomingCall表而不是Call表
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
    console.error('Error fetching incoming call history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call history'
    });
  }
});

// 分配Twilio号码给用户（管理功能）
router.post('/assign-number', auth, async (req, res) => {
  try {
    const { twilioNumber } = req.body;
    
    if (!twilioNumber) {
      return res.status(400).json({
        success: false,
        message: 'Twilio number is required'
      });
    }
    
    // 检查号码是否已被使用
    const existingSettings = await IncomingCallSettings.findOne({
      where: { twilioNumber }
    });
    
    if (existingSettings && existingSettings.userId !== req.user.userId) {
      return res.status(409).json({
        success: false,
        message: 'This number is already assigned to another user'
      });
    }
    
    const [settings, created] = await IncomingCallSettings.findOrCreate({
      where: { userId: req.user.userId },
      defaults: {
        userId: req.user.userId,
        twilioNumber,
        forwardingEnabled: true,
        voicemailEnabled: true
      }
    });
    
    if (!created) {
      await settings.update({ twilioNumber });
    }
    
    res.json({
      success: true,
      settings,
      message: `Number ${twilioNumber} assigned successfully`
    });
  } catch (error) {
    console.error('Error assigning Twilio number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign number'
    });
  }
});

// 处理Twilio Status Webhook回调 - 修复404错误
router.post('/webhook/status', async (req, res) => {
  console.log('📞 =================================');
  console.log('📞 Status webhook triggered');
  console.log('📞 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📞 =================================');
  
  try {
    const { 
      CallSid, 
      CallStatus, 
      CallDuration,
      From,
      To,
      Direction,
      RecordingUrl,
      AnsweredBy // 引入 AnsweredBy 参数
    } = req.body;
    
    console.log('📞 Status update:', {
      callSid: CallSid,
      status: CallStatus,
      duration: CallDuration,
      direction: Direction,
      answeredBy: AnsweredBy // 记录 answeredBy
    });
    
    // 更新通话记录状态（不阻塞响应）
    try {
      if (CallSid) {
        // 确定最终通话状态
        let finalStatus;
        if (CallStatus === 'completed' && AnsweredBy) {
          finalStatus = 'answered';
        } else if (CallStatus === 'no-answer' || CallStatus === 'busy' || CallStatus === 'canceled') {
          finalStatus = 'missed';
        } else if (CallStatus === 'completed' && !AnsweredBy) {
          // 响铃后无人接听，最终也算作 missed
          finalStatus = 'missed';
        } else {
          // 'failed' 或其他状态直接使用
          finalStatus = CallStatus;
        }

        // 🔧 修复：只更新IncomingCall表的状态（来电不再创建Call记录）
        try {
          const incomingCall = await IncomingCall.findOne({ where: { callSid: CallSid } });
          if (incomingCall) {
            // 如果来电已经被用户主动接听或拒接，不要覆盖这个由用户操作决定的最终状态
            if (incomingCall.status === 'answered' || incomingCall.status === 'rejected') {
              console.log(`📞 Preserving final status '${incomingCall.status}' set by user action.`);
              // 只更新通话的元数据，不改变最终状态
              const updateFields = { endTime: new Date() };
              if (CallDuration) {
                updateFields.duration = parseInt(CallDuration, 10);
              }
              if (RecordingUrl) {
                updateFields.recordingUrl = RecordingUrl;
                updateFields.hasRecording = true;
              }
              await incomingCall.update(updateFields);
            } else {
              // 如果用户未操作，则使用我们已经计算好的 finalStatus
              const duration = parseInt(CallDuration, 10) || 0;
              const incomingUpdateData = {
                status: finalStatus,
                endTime: new Date(),
                duration: duration
              };
            
              if (RecordingUrl) {
                incomingUpdateData.recordingUrl = RecordingUrl;
                incomingUpdateData.hasRecording = true;
              }
            
              await incomingCall.update(incomingUpdateData);
            }
            
            console.log(`✅ IncomingCall status updated in database with final status: ${finalStatus}`);

            // 🔧 修复：当通话成功完成时，更新电话号码的统计数据
            if (finalStatus === 'answered' && CallDuration && parseInt(CallDuration, 10) > 0) {
              try {
                const phoneNumberRecord = await UserPhoneNumber.findOne({ where: { phoneNumber: incomingCall.toNumber } });
                if (phoneNumberRecord) {
                  const callSeconds = parseInt(CallDuration, 10);
                  await phoneNumberRecord.increment({
                    'totalAnsweredCalls': 1,
                    'totalIncomingSeconds': callSeconds
                  });
                  console.log(`✅ Updated statistics for ${incomingCall.toNumber}: +1 answered call, +${callSeconds} seconds`);
                } else {
                  console.warn(`⚠️ Could not find UserPhoneNumber record for ${incomingCall.toNumber} to update stats.`);
                }
              } catch (statError) {
                console.error('❌ Failed to update phone number statistics:', statError);
              }
            }
            
            // 通知前端状态变化
            try {
              const io = req.app.get('io');
              if (io && incomingCall.userId) {
                io.to(`user_${incomingCall.userId}`).emit('callStatusUpdate', {
                  callSid: CallSid,
                  status: finalStatus, // 确保前端也收到正确的状态
                  duration: CallDuration,
                  callId: incomingCall.id
                });
                console.log('📡 Status update sent via WebSocket');
              }
            } catch (wsError) {
              console.warn('⚠️ WebSocket notification failed:', wsError);
            }
          } else {
            console.warn('⚠️ IncomingCall record not found for status update:', CallSid);
          }
        } catch (incomingError) {
          console.warn('⚠️ Failed to update IncomingCall status:', incomingError.message);
        }
      }
    } catch (dbError) {
      console.warn('⚠️ Failed to update call status in database:', dbError.message);
    }
    
    // 返回200状态确认收到webhook
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Error processing status webhook:', error);
    // 即使出错也返回200，避免Twilio重试
    res.status(200).send('ERROR');
  }
});

// 辅助函数：检查营业时间
function checkBusinessHours(businessHours) {
  if (!businessHours || !businessHours.enabled) {
    return true; // 如果未启用营业时间，总是可用
  }
  
  const now = new Date();
  const timezone = businessHours.timezone || 'UTC';
  
  // 简化的时间检查（实际应用中应该使用更精确的时区处理）
  const currentDay = now.toLocaleDateString('en-US', { 
    weekday: 'lowercase',
    timeZone: timezone 
  });
  
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
}

// 从队列中接听来电
router.post('/accept-queued-call', auth, async (req, res) => {
  try {
    const { callSid } = req.body;
    const userId = req.user.userId;
    
    console.log('📞 Accepting queued call:', { callSid, userId });
    
    // 直接生成 token，而不是通过 HTTP 请求调用自己的 API
    const { generateAccessToken } = require('../config/twilio');
    const identity = `user_${userId}`;
    const token = generateAccessToken(identity);
    
    console.log('✅ Token generated for user:', identity);
    
    // 返回信息让前端建立连接
    res.json({
      success: true,
      token,
      queueName: `queue_${userId}`,
      callSid
    });
    
  } catch (error) {
    console.error('❌ Error accepting queued call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept call'
    });
  }
});

// 处理队列状态回调
router.post('/webhook/queue-status/:callSid', async (req, res) => {
  console.log('📞 Queue status webhook received:', req.body);
  
  res.set('Content-Type', 'text/xml; charset=utf-8');
  
  try {
    const { QueueResult, QueueTime } = req.body;
    const { callSid } = req.params;
    
    console.log('📞 Queue status:', {
      callSid,
      QueueResult,
      QueueTime
    });
    
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    if (QueueResult === 'bridged') {
      // 🔧 关键修复：处理队列桥接成功的情况
      console.log('📞 Call successfully bridged from queue - updating status to answered');
      
      try {
        // 查找来电记录并更新状态为已接听
        const incomingCall = await IncomingCall.findOne({ where: { callSid } });
        if (incomingCall) {
          await incomingCall.update({
            status: 'answered',
            answerTime: new Date(),
            handledBy: 'user'
          });
          console.log('✅ IncomingCall status updated to answered for bridged call');
          
          // 注意：来电不再创建Call记录，只更新IncomingCall记录
        }
      } catch (error) {
        console.error('❌ Failed to update call status for bridged call:', error);
      }
      
      // 返回空响应，让通话继续
      return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      
    } else if (QueueResult === 'hangup' || QueueResult === 'system-error') {
      // 来电者挂断或系统错误
      console.log('📞 Caller hung up or system error while in queue');
      
      // 🔧 通知前端取消来电面板
      try {
        // 查找来电记录获取用户ID
        const incomingCall = await IncomingCall.findOne({ where: { callSid } });
        if (incomingCall && incomingCall.userId) {
          console.log('📞 Notifying user about call cancellation:', {
            userId: incomingCall.userId,
            callSid: callSid,
            reason: 'caller_hangup'
          });
          
          // 使用WebSocketManager通知用户
          webSocketManager.io.to(`user_${incomingCall.userId}`).emit('incoming_call_canceled', {
            callSid: callSid,
            status: 'canceled',
            reason: 'caller_hangup',
            timestamp: new Date().toISOString()
          });
          
          // 更新来电记录状态
          await incomingCall.update({
            status: 'canceled',
            endTime: new Date()
          });
          
          // 注意：来电不再创建Call记录，只更新IncomingCall记录
        }
      } catch (error) {
        console.error('❌ Failed to notify about call cancellation:', error);
      }
      
      // 添加 hangup 指令，避免空响应
      twiml.hangup();
    } else if (QueueResult === 'queue-full') {
      // 队列满
      twiml.say('All agents are busy. Please try again later.');
    } else if (QueueResult === 'timeout') {
      // 超时，转到语音信箱
      twiml.say('No one is available to take your call. Please leave a message.');
      twiml.record({
        maxLength: 300,
        playBeep: true
      });
    }
    
    return res.status(200).send(twiml.toString());
  } catch (error) {
    console.error('❌ Error in queue status webhook:', error);
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
});

module.exports = router; 