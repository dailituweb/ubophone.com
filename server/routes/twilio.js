const express = require('express');
const router = express.Router();
const { generateAccessToken, getCallRates, makeCall, getCallLogs, getCallQualityMetrics, analyzeRecordingQuality, startQualityMonitoring, generateQualityReport, isConfigured } = require('../config/twilio');
const { Call, CallRecording, User } = require('../models');
const auth = require('../middleware/auth');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const { getCountryFromPhoneNumber } = require('../utils/phoneUtils');
const { invalidateCache } = require('../middleware/cache');

// 调试路由 - 检查Twilio配置状态（无需认证）
router.get('/debug/status', (req, res) => {
  const configStatus = {
    TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
    TWILIO_API_KEY: !!process.env.TWILIO_API_KEY,
    TWILIO_API_SECRET: !!process.env.TWILIO_API_SECRET,
    TWILIO_TWIML_APP_SID: !!process.env.TWILIO_TWIML_APP_SID,
    TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER
  };

  res.json({
    success: true,
    twilioConfigured: isConfigured,
    configStatus,
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.APP_URL,
    timestamp: new Date().toISOString(),
    message: isConfigured ? 'Twilio is properly configured' : 'Twilio configuration missing'
  });
});

// 获取Twilio访问令牌
router.post('/token', auth, async (req, res) => {
  try {
    // Check if Twilio is configured first
    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Voice calling service is not available. Please contact administrator.',
        errorCode: 'TWILIO_NOT_CONFIGURED'
      });
    }

    const { userId } = req.user;
    const identity = `user_${userId}`;
    
    const token = generateAccessToken(identity);
    
    res.json({
      success: true,
      token: token,
      identity: identity
    });
  } catch (error) {
    console.error('Error generating token:', error);
    
    if (error.message.includes('Twilio configuration')) {
      res.status(503).json({
        success: false,
        message: 'Voice calling service is not available. Please contact administrator.',
        errorCode: 'TWILIO_NOT_CONFIGURED'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate access token'
      });
    }
  }
});

// 获取通话费率
router.get('/rates/:country', auth, async (req, res) => {
  try {
    const { country } = req.params;
    const rates = await getCallRates('US', country.toUpperCase());
    
    res.json({
      success: true,
      rates: rates
    });
  } catch (error) {
    console.error('Error getting rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rates'
    });
  }
});

// 发起通话
router.post('/call', auth, async (req, res) => {
  try {
    // Check if Twilio is configured first
    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Voice calling service is not available. Please contact administrator.',
        errorCode: 'TWILIO_NOT_CONFIGURED'
      });
    }

    const { to, from } = req.body;
    const { userId } = req.user;
    
    // 🔧 优先使用前端传递的 caller ID，然后才是数据库默认设置
    let userCallerIdNumber = null;
    
    if (from) {
      // 前端明确指定了来电显示号码
      userCallerIdNumber = from;
      console.log('📞 Using frontend-specified caller ID:', userCallerIdNumber);
    } else {
      // 前端没有指定，尝试从数据库获取用户的默认来电显示号码
      try {
        const { User, UserPhoneNumber } = require('../models');
        const user = await User.findByPk(userId, {
          include: [
            {
              model: UserPhoneNumber,
              as: 'defaultCallerIdNumber',
              attributes: ['phoneNumber'],
              required: false
            }
          ]
        });
        
        if (user && user.defaultCallerIdNumber) {
          userCallerIdNumber = user.defaultCallerIdNumber.phoneNumber;
          console.log('📞 Using user default caller ID from database:', userCallerIdNumber);
        } else {
          console.log('📞 No default caller ID set, will use system default');
        }
      } catch (callerIdError) {
        console.warn('⚠️ Error getting user caller ID:', callerIdError);
      }
    }
    
    // 这里应该验证用户余额是否足够
    // 暂时跳过余额验证
    
    // 从目标号码中提取国家代码
    let targetCountryCode = 'US'; // 默认国家
    let finalRate = 0.02; // 默认费率
    
    try {
      // 使用工具函数提取国家代码
      targetCountryCode = getCountryFromPhoneNumber(to);
      
      // 使用 getCallRates 获取费率
      console.log(`Getting rates for call from US to ${targetCountryCode}`);
      const rates = await getCallRates('US', targetCountryCode);
      
      if (rates && rates.outboundRate) {
        const rawRate = rates.outboundRate;
        // 加价100%（乘以2）
        finalRate = Math.max(0.005, rawRate * 2);
        console.log(`Raw rate: ${rawRate}, Final rate (100% markup): ${finalRate}`);
      } else {
        console.log('Failed to get rates, using default rate 0.02');
        finalRate = 0.02;
      }
    } catch (rateError) {
      console.error('Error getting call rates:', rateError);
      // 如果获取费率失败，使用默认费率
      finalRate = 0.02;
    }
    
    const port = process.env.PORT || 5001;
    const callbackUrl = `${process.env.APP_URL || `http://localhost:${port}`}/api/twilio/voice`;
    
    // 🔧 确定要使用的来电显示号码（优先级：前端指定 > 用户默认 > 系统默认）
    const callerIdToUse = from || userCallerIdNumber || process.env.TWILIO_PHONE_NUMBER || '+19156152367';
    
    console.log('📞 Caller ID selection:', {
      frontendSpecified: from,
      userDefault: userCallerIdNumber,
      systemDefault: process.env.TWILIO_PHONE_NUMBER || '+19156152367',
      finalChoice: callerIdToUse
    });
    
    const result = await makeCall(callerIdToUse, to, callbackUrl);
    
    if (result.success) {
      // 保存通话记录到数据库，包含初始质量指标和动态费率
      const call = await Call.create({
        callSid: result.callSid,
        userId: userId,
        fromNumber: callerIdToUse, // 使用实际的来电显示号码
        toNumber: to,
        direction: 'outbound',
        status: result.status,
        rate: finalRate, // 使用动态计算的费率
        country: targetCountryCode, // 使用检测到的目标国家
        startTime: new Date(),
        audioQuality: result.qualityMetrics || {},
        networkAnalysis: {
          connectionType: 'unknown',
          codecUsed: 'OPUS'
        },
        metadata: {
          userCallerIdNumber: userCallerIdNumber, // 存储用户的来电显示号码
          frontendSpecifiedCallerId: from, // 前端指定的来电显示号码
          systemCallerIdUsed: !from && !userCallerIdNumber, // 标记是否使用了系统默认号码
          callerIdSource: from ? 'frontend' : (userCallerIdNumber ? 'user_default' : 'system_default'),
          recordCreatedBy: 'backend_api' // 标记记录创建来源
        }
      });
      
      console.log('📞 Call record created in database:', {
        callId: call.id,
        callSid: result.callSid,
        userId: userId,
        from: callerIdToUse,
        to: to,
        rate: finalRate,
        country: targetCountryCode,
        note: 'This record will be updated by webhook when call completes'
      });

      // 清除通话历史缓存，确保新通话立即显示
      console.log('🔄 Invalidating call history cache after new call creation');
      const invalidatedKeys = invalidateCache('/api/calls/history');
      console.log(`✅ Invalidated ${invalidatedKeys} cache keys`);

      res.json({
        success: true,
        callSid: result.callSid,
        status: result.status,
        callId: call.id,
        qualityMetrics: result.qualityMetrics
      });
    } else {
      if (result.error && result.error.includes('Twilio client not initialized')) {
        res.status(503).json({
          success: false,
          message: 'Voice calling service is not available. Please contact administrator.',
          errorCode: 'TWILIO_NOT_CONFIGURED'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    }
  } catch (error) {
    console.error('Error making call:', error);
    
    if (error.message && error.message.includes('Twilio client not initialized')) {
      res.status(503).json({
        success: false,
        message: 'Voice calling service is not available. Please contact administrator.',
        errorCode: 'TWILIO_NOT_CONFIGURED'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to make call'
      });
    }
  }
});

// Twilio语音回调处理 - TwiML应用的webhook - 修复版本
router.post('/voice', async (req, res) => {
  console.log('📞 =================================');
  console.log('📞 Twilio voice webhook triggered');
  console.log('📞 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📞 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('📞 =================================');

  try {
    // 立即设置正确的响应头
    res.set({
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-cache'
    });

    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const response = new VoiceResponse();

    const { To, From, CallSid, Direction, Called, CallStatus } = req.body || {};

    console.log('📞 Call Parameters:', {
      To, From, CallSid, Direction, Called, CallStatus,
      timestamp: new Date().toISOString()
    });

    // 🔧 修复：更严格的参数验证和处理
    if (!CallSid) {
      console.error('❌ Missing CallSid in webhook request');
      console.error('❌ Full request details for debugging:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query
      });

      // 🔧 检查是否是TwiML应用配置问题
      if (req.body && Object.keys(req.body).length === 0 && req.query && Object.keys(req.query).length === 0) {
        console.error('❌ Empty request body and query - possible TwiML app webhook URL misconfiguration');
        console.error('❌ Expected webhook URL format: https://your-domain.com/api/twilio/voice');
        console.error('❌ Current request URL:', req.url);
        console.error('❌ Please check your TwiML Application webhook configuration in Twilio Console');
      }

      response.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Invalid call request. Please check your TwiML application configuration and try again.');

      const twimlResponse = response.toString();
      console.log('📤 Error TwiML response:', twimlResponse);
      return res.status(200).send(twimlResponse);
    }

    // 🔧 修复：正确检测通话类型，特别处理Twilio Voice SDK客户端通话
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+19156152367';

    // 检测是否为Twilio Voice SDK客户端发起的通话
    // 🔧 修复：检查Caller字段而不是From字段来识别客户端通话
    const isClientCall = (From && From.startsWith('client:')) || 
                        (req.body.Caller && req.body.Caller.startsWith('client:'));

    console.log('📞 Client call detection:', {
      From,
      Caller: req.body.Caller,
      isClientCall,
      fromStartsWithClient: From && From.startsWith('client:'),
      callerStartsWithClient: req.body.Caller && req.body.Caller.startsWith('client:')
    });

    // 判断通话类型
    let isOutboundCall = false;
    let isInboundCall = false;
    let targetNumber = null;

    if (isClientCall) {
      // 🔧 这是从Twilio Voice SDK客户端发起的通话
      // Twilio Voice SDK通过device.connect({params: {To: number}})传递的参数
      // 这些参数会作为POST body中的自定义字段传递
      console.log('📞 Detected Twilio Voice SDK client call from:', From);
      console.log('📞 Raw request body:', JSON.stringify(req.body, null, 2));
      console.log('📞 Raw request query:', JSON.stringify(req.query, null, 2));
      
      // 🔧 关键修复：Twilio Voice SDK的参数传递机制
      // 当使用device.connect({params: {To: "+1234567890"}})时
      // 参数会作为请求体中的字段传递，不是标准的To/From字段
      
      // 🔧 增强参数检测：检查所有可能的参数位置和格式
      const allPossibleTargets = [
        // 标准参数 - 优先检查最常见的
        req.body.To, req.body.to, req.body.TO,
        req.body.Called, req.body.called, req.body.CALLED,
        To, Called,

        // 自定义参数（device.connect的params）
        req.body.NUMBER, req.body.number, req.body.Number,
        req.body.Destination, req.body.destination, req.body.DESTINATION,  
        req.body.target, req.body.Target, req.body.TARGET,
        req.body.targetNumber, req.body.target_number,
        req.body.phonenumber, req.body.phoneNumber, req.body.phone_number,

        // Query参数
        req.query.To, req.query.to, req.query.TO,
        req.query.Called, req.query.called,
        req.query.number, req.query.Number, req.query.NUMBER,
        req.query.targetNumber, req.query.target_number,
        req.query.destination, req.query.Destination,

        // Headers中可能的参数（某些情况下）
        req.headers['x-target-number'],
        req.headers['x-destination']
      ].filter(param => {
        // 更严格的参数验证
        return param && 
               typeof param === 'string' && 
               param.trim() !== '' && 
               param !== 'undefined' && 
               param !== 'null';
      });

      // 选择第一个有效的参数作为目标号码
      targetNumber = allPossibleTargets[0] || null;

      // 🔧 如果没有找到，直接检查req.body.To（这应该是最直接的方式）
      if (!targetNumber && req.body.To && typeof req.body.To === 'string' && req.body.To.trim()) {
        targetNumber = req.body.To.trim();
        console.log('📞 Found target number directly in req.body.To:', targetNumber);
      }

      // 🔧 如果仍然没有找到目标号码，尝试从URL路径中提取
      if (!targetNumber && req.url) {
        const urlMatch = req.url.match(/[?&](?:to|number|destination)=([^&]+)/i);
        if (urlMatch) {
          targetNumber = decodeURIComponent(urlMatch[1]);
          console.log('📞 Found target number in URL:', targetNumber);
        }
      }
      
      console.log('📞 Enhanced parameter search for client call:', {
        'From': From,
        'Standard To': To,
        'Standard Called': Called,
        'Request Body Keys': Object.keys(req.body),
        'Request Body': req.body,
        'Request Query': req.query,
        'All possible targets found': allPossibleTargets.slice(0, 5), // 只显示前5个
        'Total candidates': allPossibleTargets.length,
        'Final targetNumber': targetNumber,
        'Request method': req.method,
        'Content-Type': req.headers['content-type']
      });

      // 🔧 如果仍然没有找到目标号码，尝试更激进的参数搜索
      if (!targetNumber) {
        console.log('📞 No target found in standard locations, trying aggressive search...');

        // 搜索所有可能包含电话号码的字段
        const allFields = { ...req.body, ...req.query };
        for (const [key, value] of Object.entries(allFields)) {
          if (typeof value === 'string' && value.match(/^\+?[1-9]\d{1,14}$/)) {
            console.log(`📞 Found potential phone number in field '${key}':`, value);
            targetNumber = value;
            break;
          }
        }

        // 如果还是没找到，检查是否有任何以+开头的值
        if (!targetNumber) {
          for (const [key, value] of Object.entries(allFields)) {
            if (typeof value === 'string' && value.startsWith('+') && value.length > 5) {
              console.log(`📞 Found potential international number in field '${key}':`, value);
              targetNumber = value;
              break;
            }
          }
        }
      }
      
      isOutboundCall = true;
    } else {
      // 传统的电话号码到电话号码的通话
      isOutboundCall = From === twilioPhoneNumber && To && To !== twilioPhoneNumber;
      isInboundCall = To === twilioPhoneNumber && From && From !== twilioPhoneNumber;
      targetNumber = To;
    }

    console.log('📞 Call type detection:', {
      Direction,
      From,
      To,
      Called: req.body.Called,
      twilioPhoneNumber,
      isClientCall,
      isOutboundCall,
      isInboundCall,
      targetNumber,
      allParams: req.body,
      allQuery: req.query,
      allHeaders: req.headers
    });

    // 🔧 如果仍然没有找到目标号码，尝试其他可能的参数名
    if (isClientCall && !targetNumber) {
      // 检查所有可能的参数名，包括Twilio Voice SDK的自定义参数
      const possibleTargets = [
        req.body.To, req.body.to, req.body.TO,
        req.body.Called, req.body.called, req.body.CALLED,
        req.body.Destination, req.body.destination,
        req.body.number, req.body.Number, req.body.NUMBER,
        req.body.targetNumber, req.body.target_number,
        req.query.To, req.query.to, req.query.TO,
        req.query.Called, req.query.called,
        req.query.number, req.query.Number,
        req.query.targetNumber, req.query.target_number,
        To, Called
      ].filter(Boolean);

      if (possibleTargets.length > 0) {
        targetNumber = possibleTargets[0];
        console.log('📞 Found target number in alternative parameter:', targetNumber);
        console.log('📞 Parameter location:', possibleTargets.length > 1 ? `first of ${possibleTargets.length} candidates` : 'single match');
      } else {
        console.log('📞 No target number found in any parameter');
        console.log('📞 Available body params:', Object.keys(req.body));
        console.log('📞 Available query params:', Object.keys(req.query));
        console.log('📞 Full request body:', JSON.stringify(req.body, null, 2));
        console.log('📞 Full query string:', JSON.stringify(req.query, null, 2));
      }
    }

    if (isOutboundCall) {
      // 🔧 这是出站通话（可能来自Voice SDK客户端或传统电话）
      console.log('📞 Processing outbound call to:', targetNumber);

      if (targetNumber && targetNumber.startsWith('+')) {
        console.log('📞 Creating dial instruction for target:', targetNumber);

        try {
          // 确定来电显示号码
          let callerIdToUse = twilioPhoneNumber;
          if (isClientCall) {
            // 对于客户端通话，优先使用前端传递的From参数作为来电显示
            const clientFrom = req.body.From || req.body.from || req.body.CallerID || req.body.callerId ||
                              req.query.From || req.query.from || req.query.CallerID || req.query.callerId;
            
            if (clientFrom) {
              callerIdToUse = clientFrom;
              console.log('📞 Using client-specified caller ID:', callerIdToUse);
            } else {
              callerIdToUse = twilioPhoneNumber;
              console.log('📞 No caller ID specified by client, using default:', callerIdToUse);
            }
          } else {
            // 对于传统通话，使用From号码
            callerIdToUse = From;
          }

          console.log('📞 Using caller ID:', callerIdToUse);

          // 直接拨打目标号码
          const dial = response.dial({
            callerId: callerIdToUse,
            timeout: 30,
            answerOnBridge: true,
            record: false,
            action: `${process.env.APP_URL || 'https://ubophone.com'}/api/twilio/dial-status`,
            method: 'POST'
          });

          dial.number(targetNumber);

          console.log('✅ Outbound dial instruction created successfully');

        } catch (dialError) {
          console.error('❌ Outbound dial error:', dialError);
          response.say({
            voice: 'alice',
            language: 'en-US'
          }, 'Unable to connect your call. Please try again.');
        }
      } else {
        console.log('❌ Invalid target number for outbound call:', targetNumber);
        console.log('❌ Diagnostic information for client call:');
        console.log('   - CallSid:', CallSid);
        console.log('   - From (client):', From);
        console.log('   - Standard To:', To);
        console.log('   - All found targets:', allPossibleTargets);
        console.log('   - Request body keys:', Object.keys(req.body || {}));
        console.log('   - Request query keys:', Object.keys(req.query || {}));
        console.log('   - Full body:', JSON.stringify(req.body, null, 2));
        console.log('   - Full query:', JSON.stringify(req.query, null, 2));

        // 🔧 提供更具体的错误信息
        if (allPossibleTargets.length === 0) {
          console.log('❌ No target number found in any parameter location');
          response.say({
            voice: 'alice',
            language: 'en-US'
          }, 'No destination number provided. Please specify a phone number to call.');
        } else {
          console.log('❌ Target number found but invalid format:', targetNumber);
          response.say({
            voice: 'alice',
            language: 'en-US'
          }, 'Invalid phone number format. Please provide a valid international phone number starting with plus sign.');
        }
      }

    } else if (isInboundCall) {
      // 🔧 这是真正的来电，需要转接给用户
      console.log('📞 Processing incoming call from:', From);

      try {
        // 首先保存来电记录到数据库
        await Call.create({
          callSid: CallSid,
          userId: null, // 稍后通过电话号码匹配用户
          fromNumber: From,
          toNumber: To,
          direction: 'inbound',
          status: 'ringing',
          startTime: new Date(),
          metadata: {
            recordCreatedBy: 'webhook_incoming',
            webhookTimestamp: new Date().toISOString()
          }
        });

        console.log('📞 Incoming call record created:', {
          callSid: CallSid,
          from: From,
          to: To,
          status: 'ringing'
        });
      } catch (dbError) {
        console.error('❌ Error saving incoming call record:', dbError);
        // 不阻断通话流程，即使数据库保存失败也继续处理
      }

      // 提供友好的来电应答
      response.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Hello! Thank you for calling Ubophone. Please hold while we process your call.');

      response.pause({ length: 2 });

      // 创建一个简单的重定向到来电处理端点
      response.redirect({
        method: 'POST'
      }, `${process.env.APP_URL || 'https://ubophone.com'}/api/incoming-calls/webhook/process-incoming`);

    } else {
      // 🔧 测试通话或其他情况 (From=To=Twilio号码，或其他未知情况)
      console.log('📞 Test call or unknown call type - From:', From, 'To:', To);
      console.log('📞 Full request details for debugging:', {
        body: req.body,
        query: req.query,
        headers: req.headers,
        isClientCall,
        isOutboundCall,
        isInboundCall,
        targetNumber,
        twilioPhoneNumber
      });

      // 如果From和To都是Twilio号码，这是测试通话
      if (From === twilioPhoneNumber && To === twilioPhoneNumber) {
        response.say({
          voice: 'alice',
          language: 'en-US'
        }, 'Hello! This is a test call from Ubophone. Your voice service is working correctly.');

        response.pause({ length: 1 });
        response.hangup();
      } else if (isClientCall) {
        // 🔧 特殊处理：如果是客户端通话但没有找到目标号码
        console.error('❌ Client call detected but no valid target number found');
        console.error('❌ Available parameters:', {
          bodyKeys: Object.keys(req.body),
          queryKeys: Object.keys(req.query),
          bodyValues: req.body,
          queryValues: req.query
        });

        // 🔧 提供备用的测试通话体验，而不是直接失败
        console.log('📞 Providing fallback test call experience');
        response.say({
          voice: 'alice',
          language: 'en-US'
        }, 'Hello! This is a test call from Ubophone. Your voice service is working, but no destination number was provided. Please check your application configuration.');

        response.pause({ length: 2 });
        response.say({
          voice: 'alice',
          language: 'en-US'
        }, 'To make actual calls, ensure your TwiML application webhook is correctly configured and parameters are being passed properly.');

        response.hangup();
      } else {
        // 其他未知情况，提供通用错误消息
        console.error('❌ Unknown call scenario:', { From, To, Direction, CallSid });
        console.error('❌ Full request details:', {
          body: req.body,
          query: req.query,
          headers: Object.keys(req.headers),
          isClientCall,
          isOutboundCall,
          isInboundCall,
          targetNumber,
          twilioPhoneNumber
        });
        response.say({
          voice: 'alice',
          language: 'en-US'
        }, 'Unable to process this call. Please check your configuration and try again.');

        response.hangup();
      }
    }

    const twimlResponse = response.toString();
    console.log('📤 Generated TwiML response:', twimlResponse);

    // 确保响应格式正确
    if (!twimlResponse.includes('<?xml')) {
      console.error('❌ Invalid TwiML format detected');
      const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">Service error. Please try again.</Say>
</Response>`;
      return res.status(200).send(fallbackTwiml);
    }

    return res.status(200).send(twimlResponse);

  } catch (error) {
    console.error('❌ Critical error in voice webhook:', error);
    console.error('❌ Error stack:', error.stack);

    // 🔧 修复：更可靠的错误处理
    const emergencyTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">We apologize for the technical difficulty. Please try your call again.</Say>
  <Hangup/>
</Response>`;

    res.set('Content-Type', 'text/xml; charset=utf-8');
    return res.status(200).send(emergencyTwiml);
  }
});

// 🔧 新增：直接拨号TwiML处理 - 专门用于API发起的通话
router.post('/voice-direct', async (req, res) => {
  console.log('📞 =================================');
  console.log('📞 Direct voice webhook triggered');
  console.log('📞 Query params:', req.query);
  console.log('📞 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📞 =================================');

  try {
    res.set({
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-cache'
    });

    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const response = new VoiceResponse();

    // 从查询参数获取目标号码
    const targetNumber = req.query.to || req.body.To;
    const fromNumber = req.query.from || req.body.From;

    console.log('📞 Direct call parameters:', { targetNumber, fromNumber });

    if (targetNumber && targetNumber.startsWith('+')) {
      console.log('📞 Creating direct dial to:', targetNumber);

      // 直接拨打目标号码
      const dial = response.dial({
        callerId: fromNumber || process.env.TWILIO_PHONE_NUMBER,
        timeout: 30,
        answerOnBridge: true,
        action: `${process.env.APP_URL || 'https://ubophone.com'}/api/twilio/dial-status`,
        method: 'POST'
      });

      dial.number(targetNumber);

      console.log('✅ Direct dial instruction created');

    } else {
      console.log('❌ Invalid target number for direct dial:', targetNumber);
      response.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Invalid phone number. Please check the number and try again.');
      response.hangup();
    }

    const twimlResponse = response.toString();
    console.log('📤 Direct dial TwiML response:', twimlResponse);

    return res.status(200).send(twimlResponse);

  } catch (error) {
    console.error('❌ Error in direct voice webhook:', error);

    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">Unable to complete your call. Please try again.</Say>
  <Hangup/>
</Response>`;

    res.set('Content-Type', 'text/xml; charset=utf-8');
    return res.status(200).send(fallbackTwiml);
  }
});

// 🔧 新增：拨号状态回调处理
router.post('/dial-status', async (req, res) => {
  console.log('📞 Dial status webhook received:', JSON.stringify(req.body, null, 2));

  try {
    res.set('Content-Type', 'text/xml; charset=utf-8');

    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const response = new VoiceResponse();

    const { DialCallStatus, CallSid } = req.body || {};

    console.log('📞 Dial status:', { DialCallStatus, CallSid });

    // 根据拨号状态处理
    switch (DialCallStatus) {
      case 'no-answer':
      case 'busy':
        response.say({
          voice: 'alice',
          language: 'en-US'
        }, 'The number you called is busy or not answering. Please try again later.');
        break;

      case 'failed':
        response.say({
          voice: 'alice',
          language: 'en-US'
        }, 'Your call could not be completed. Please check the number and try again.');
        break;

      case 'completed':
        // 通话正常结束，不需要额外操作
        console.log('📞 Call completed successfully');
        break;

      default:
        console.log('📞 Unhandled dial status:', DialCallStatus);
        break;
    }

    const twimlResponse = response.toString();
    console.log('📤 Dial status TwiML response:', twimlResponse);

    return res.status(200).send(twimlResponse);

  } catch (error) {
    console.error('❌ Error in dial status webhook:', error);

    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;

    res.set('Content-Type', 'text/xml; charset=utf-8');
    return res.status(200).send(fallbackTwiml);
  }
});

// 通话状态回调（增强版本，包含质量更新和计费逻辑）
router.post('/call-status', async (req, res) => {
  try {
    const {
      CallSid,
      CallStatus,
      CallDuration,
      RecordingUrl,
      // Additional quality-related parameters that Twilio might send
      Codec,
      CallerCountry,
      CalledCountry
    } = req.body;

    console.log('Enhanced Call Status Update:', {
      sid: CallSid,
      status: CallStatus,
      duration: CallDuration,
      recording: RecordingUrl,
      codec: Codec
    });

    // Find and update call record
    const call = await Call.findOne({ where: { callSid: CallSid } });
    if (call) {
      const updateData = {
        status: CallStatus,
        endTime: new Date()
      };
      
      if (CallDuration) {
        updateData.duration = parseInt(CallDuration);
      }
      
      if (Codec) {
        updateData.networkAnalysis = {
          ...call.networkAnalysis,
          codecUsed: Codec
        };
      }
      
      // If call is completed, calculate cost and update user balance
      if (CallStatus === 'completed') {
        try {
          // Get call duration in seconds
          const durationInSeconds = CallDuration ? parseInt(CallDuration) : 60; // Default to 1 minute if missing
          
          // Calculate minutes using ceiling (round up)
          const minutes = Math.ceil(durationInSeconds / 60);
          
          // Get the rate from the call record
          const rate = parseFloat(call.rate || 0.02);
          
          // Calculate cost with ceiling minutes
          const cost = parseFloat((rate * minutes).toFixed(3));
          
          // Add cost to update data
          updateData.cost = cost;
          
          // Log billing details
          console.log('[Billing] Raw duration:', durationInSeconds, '→ Rounded minutes:', minutes, '→ Final cost:', cost);
          console.log('[Billing] Rate:', rate, '| Call:', CallSid);
          
          // Update user balance if cost > 0
          if (cost > 0 && call.userId) {
            try {
              // Find user and update balance
              const user = await User.findByPk(call.userId);
              if (user) {
                const oldBalance = parseFloat(user.balance);
                const newBalance = Math.max(0, oldBalance - cost);
                
                await user.update({
                  balance: newBalance
                });
                
                console.log('[Billing] User:', call.userId, '| Balance updated:', oldBalance, '→', newBalance);
                
                // Optional: Send balance update notification via WebSocket
                const io = req.app.get('io');
                if (io) {
                  io.to(`user_${call.userId}`).emit('balanceUpdate', {
                    oldBalance,
                    newBalance,
                    cost,
                    callSid: CallSid
                  });
                }
              } else {
                console.error('[Billing] User not found:', call.userId);
              }
            } catch (billingError) {
              console.error('[Billing] Error updating user balance:', billingError);
              // Don't fail the entire request if billing fails
            }
          }
          
          // Get quality metrics
          const qualityMetrics = await getCallQualityMetrics(CallSid);
          if (qualityMetrics.success) {
            updateData.audioQuality = qualityMetrics.metrics.audioQuality;
            updateData.networkAnalysis = {
              ...updateData.networkAnalysis,
              ...qualityMetrics.metrics.networkAnalysis
            };
          }
        } catch (error) {
          console.error('Error processing call completion:', error);
        }
      }
      
      await call.update(updateData);
      
      console.log('📞 Call record updated by webhook:', {
        callId: call.id,
        callSid: CallSid,
        oldStatus: call.status,
        newStatus: CallStatus,
        duration: CallDuration,
        cost: updateData.cost,
        updatedBy: 'twilio_webhook',
        note: 'This prevents duplicate records from frontend'
      });
      
      // 清除相关缓存，确保前端能立即看到更新
      console.log('🔄 Invalidating call history cache after status update');
      const invalidatedKeys = invalidateCache('/api/calls/history');
      console.log(`✅ Invalidated ${invalidatedKeys} cache keys`);
      
      // 🔔 通过WebSocket通知前端通话已结束
      if (CallStatus === 'completed' || CallStatus === 'failed' || CallStatus === 'busy' || CallStatus === 'no-answer' || CallStatus === 'canceled') {
        const io = req.app.get('io');
        if (io && call.userId) {
          console.log('📡 Sending callEnded event via WebSocket to user:', call.userId);
          
          // 检查通话方向，如果是来电且状态为canceled/no-answer/busy，发送来电取消事件
          if (call.direction === 'inbound' && (CallStatus === 'canceled' || CallStatus === 'no-answer' || CallStatus === 'busy')) {
            console.log('📡 Sending incoming_call_canceled event for inbound call:', CallSid);
            io.to(`user_${call.userId}`).emit('incoming_call_canceled', { 
              callSid: CallSid,
              status: CallStatus,
              reason: CallStatus === 'canceled' ? 'caller_hangup' : CallStatus,
              timestamp: new Date().toISOString()
            });
          } else {
            // 正常的通话结束事件
            io.to(`user_${call.userId}`).emit('callEnded', { 
              callSid: CallSid,
              status: CallStatus,
              duration: CallDuration,
              cost: updateData.cost
            });
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing enhanced call status:', error);
    res.status(500).send('Error');
  }
});

// 录音状态回调
router.post('/recording-status', async (req, res) => {
  try {
    const { 
      RecordingSid, 
      RecordingUrl, 
      RecordingStatus,
      CallSid,
      RecordingDuration,
      RecordingChannels,
      RecordingSource
    } = req.body;
    
    console.log('🎙️ Recording Status Update:', {
      sid: RecordingSid,
      url: RecordingUrl,
      status: RecordingStatus,
      callSid: CallSid,
      duration: RecordingDuration,
      channels: RecordingChannels
    });
    
    // 保存录音信息到数据库
    if (RecordingStatus === 'completed' && RecordingUrl) {
      try {
        // 找到对应的通话记录
        const call = await Call.findOne({ where: { callSid: CallSid } });
        
        if (call) {
          // 创建录音记录（如果有CallRecording模型）
          if (CallRecording) {
            await CallRecording.create({
              recordingSid: RecordingSid,
              callId: call.id,
              userId: call.userId,
              recordingUrl: RecordingUrl,
              duration: parseInt(RecordingDuration) || 0,
              channels: RecordingChannels || 'mono',
              source: RecordingSource || 'twilio',
              status: RecordingStatus,
              fileSize: 0, // 将在后续更新
              createdAt: new Date()
            });
          }
          
          // 更新通话记录，添加录音URL
          await call.update({
            recordingUrl: RecordingUrl,
            recordingSid: RecordingSid,
            hasRecording: true
          });
          
          console.log('✅ Recording information saved to database');
        } else {
          console.warn('⚠️ Call not found for recording:', CallSid);
        }
      } catch (dbError) {
        console.error('❌ Error saving recording to database:', dbError);
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error processing recording status:', error);
    res.status(500).send('Error');
  }
});

// 获取通话历史
router.get('/call-history', auth, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const calls = await getCallLogs(null, limit);
    
    res.json({
      success: true,
      calls: calls
    });
  } catch (error) {
    console.error('Error getting call history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call history'
    });
  }
});

// 检查通话状态
router.get('/call/:callSid/status', auth, async (req, res) => {
  try {
    const { callSid } = req.params;
    const { client } = require('../config/twilio');
    
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'Voice calling service is not available. Twilio configuration required.',
        errorCode: 'TWILIO_NOT_CONFIGURED'
      });
    }
    
    const call = await client.calls(callSid).fetch();
    
    res.json({
      success: true,
      call: {
        sid: call.sid,
        status: call.status,
        duration: call.duration,
        price: call.price,
        priceUnit: call.priceUnit
      }
    });
  } catch (error) {
    console.error('Error getting call status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call status'
    });
  }
});

// 获取通话质量指标
router.get('/call/:callSid/quality', auth, async (req, res) => {
  try {
    const { callSid } = req.params;
    
    // Verify call belongs to user
    const call = await Call.findOne({
      where: { callSid, userId: req.user.userId }
    });
    
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }
    
    const qualityMetrics = await getCallQualityMetrics(callSid);
    
    if (qualityMetrics.success) {
      // Update call record with latest quality metrics
      await call.update({
        audioQuality: qualityMetrics.metrics.audioQuality,
        networkAnalysis: qualityMetrics.metrics.networkAnalysis
      });
    }
    
    res.json(qualityMetrics);
  } catch (error) {
    console.error('Error getting call quality:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call quality metrics'
    });
  }
});

// 开始实时质量监控
router.post('/call/:callSid/monitor', auth, async (req, res) => {
  try {
    const { callSid } = req.params;
    
    // Verify call belongs to user
    const call = await Call.findOne({
      where: { callSid, userId: req.user.userId }
    });
    
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }
    
    // Start monitoring (in a real app, this would use WebSockets)
    const monitoring = await startQualityMonitoring(callSid, (metrics) => {
      // In a real implementation, you would emit this data via WebSocket
      console.log('Real-time quality metrics:', metrics);
    });
    
    res.json({
      success: true,
      monitoring: monitoring.success,
      message: 'Quality monitoring started'
    });
  } catch (error) {
    console.error('Error starting quality monitoring:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start quality monitoring'
    });
  }
});

// 分析录音质量
router.post('/recording/:recordingSid/analyze', auth, async (req, res) => {
  try {
    const { recordingSid } = req.params;
    
    // Find recording and verify ownership
    const recording = await CallRecording.findOne({
      where: { recordingSid, userId: req.user.userId }
    });
    
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }
    
    const analysis = await analyzeRecordingQuality(recordingSid);
    
    if (analysis.success) {
      // Update recording with analysis results
      await recording.update({
        qualityMetrics: {
          recordingQuality: analysis.analysis.qualityScore,
          clarity: analysis.analysis.clarity,
          backgroundNoise: analysis.analysis.backgroundNoise,
          speechQuality: analysis.analysis.speechQuality,
          audioDistortion: analysis.analysis.audioDistortion
        },
        audioAnalysis: {
          recommendations: analysis.analysis.recommendations
        }
      });
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing recording quality:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze recording quality'
    });
  }
});

// 生成质量报告
router.get('/quality/report', auth, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    // Get user's calls within date range
    const whereClause = { userId: req.user.userId };
    if (startDate && endDate) {
      whereClause.startTime = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const calls = await Call.findAll({
      where: whereClause,
      attributes: ['callSid', 'startTime', 'duration', 'audioQuality', 'networkAnalysis'],
      order: [['startTime', 'DESC']],
      limit: 100
    });
    
    const callSids = calls.map(call => call.callSid);
    const qualityReport = await generateQualityReport(callSids);
    
    if (format === 'pdf') {
      // TODO: Implement PDF generation
      return res.status(501).json({
        success: false,
        message: 'PDF export not implemented yet'
      });
    }
    
    res.json({
      success: true,
      report: qualityReport.success ? qualityReport.report : null,
      detailed: qualityReport.success ? qualityReport.detailed : [],
      period: {
        startDate: startDate || calls[calls.length - 1]?.startTime,
        endDate: endDate || calls[0]?.startTime,
        totalCalls: calls.length
      }
    });
  } catch (error) {
    console.error('Error generating quality report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quality report'
    });
  }
});

// Test endpoint to verify routing
router.get('/test-endpoint', (req, res) => {
  res.json({
    success: true,
    message: 'Twilio router is working',
    timestamp: new Date().toISOString()
  });
});

// 🔧 新增：TwiML应用诊断端点
router.all('/voice-debug', (req, res) => {
  console.log('🔍 ===== VOICE DEBUG ENDPOINT =====');
  console.log('🔍 Method:', req.method);
  console.log('🔍 URL:', req.url);
  console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 Body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Query:', JSON.stringify(req.query, null, 2));
  console.log('🔍 Params:', JSON.stringify(req.params, null, 2));
  console.log('🔍 ================================');

  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const response = new VoiceResponse();

  response.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Debug endpoint reached successfully. Check server logs for request details.');

  res.set('Content-Type', 'text/xml; charset=utf-8');
  res.status(200).send(response.toString());
});

// 🔧 新增：TwiML应用配置检查端点
router.get('/config-check', (req, res) => {
  const baseUrl = process.env.APP_URL || process.env.BASE_URL || 'https://ubophone.com';
  const expectedWebhookUrl = `${baseUrl}/api/twilio/voice`;

  const configInfo = {
    success: true,
    message: 'TwiML Application Configuration Check',
    timestamp: new Date().toISOString(),
    configuration: {
      baseUrl: baseUrl,
      expectedWebhookUrl: expectedWebhookUrl,
      twilioConfig: {
        accountSid: process.env.TWILIO_ACCOUNT_SID ? '✓ Configured' : '✗ Missing',
        authToken: process.env.TWILIO_AUTH_TOKEN ? '✓ Configured' : '✗ Missing',
        apiKey: process.env.TWILIO_API_KEY ? '✓ Configured' : '✗ Missing',
        apiSecret: process.env.TWILIO_API_SECRET ? '✓ Configured' : '✗ Missing',
        twimlAppSid: process.env.TWILIO_TWIML_APP_SID ? '✓ Configured' : '✗ Missing',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER ? '✓ Configured' : '✗ Missing'
      },
      instructions: {
        step1: 'Go to Twilio Console > Develop > TwiML > TwiML Apps',
        step2: `Find your TwiML App (SID: ${process.env.TWILIO_TWIML_APP_SID || 'NOT_CONFIGURED'})`,
        step3: `Set Voice Request URL to: ${expectedWebhookUrl}`,
        step4: 'Set Voice Request Method to: POST',
        step5: 'Save the configuration',
        step6: 'Test the webhook using the debug endpoint: /api/twilio/voice-debug'
      }
    }
  };

  res.json(configInfo);
});

// 接受来电 - 新增端点 (with logging)
router.post('/accept-incoming-call', auth, async (req, res) => {
  console.log('🔥 ACCEPT-INCOMING-CALL ENDPOINT HIT:', req.body);
  try {
    const { callSid, callId } = req.body;
    const { userId } = req.user;
    
    console.log('📞 Accept incoming call request:', { callSid, callId, userId });
    
    // Check if Twilio is configured
    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Voice calling service is not available. Please contact administrator.',
        errorCode: 'TWILIO_NOT_CONFIGURED'
      });
    }
    
    // 验证通话是否存在并属于用户 - 优化查询条件
    console.log('📞 Searching for call with criteria:', { callSid, userId, direction: 'inbound' });
    
    const call = await Call.findOne({
      where: { 
        callSid: callSid,
        userId: userId,
        direction: 'inbound'
        // 移除严格的status检查，允许更灵活的状态处理
      },
      attributes: ['id', 'callSid', 'fromNumber', 'toNumber', 'status', 'startTime', 'endTime']
    });
    
    console.log('📞 Database query result:', call ? {
      id: call.id,
      callSid: call.callSid,
      status: call.status,
      startTime: call.startTime,
      endTime: call.endTime
    } : 'null');
    
    if (!call) {
      console.warn('📞 Call not found:', { callSid, userId, direction: 'inbound' });
      return res.status(404).json({
        success: false,
        message: 'Incoming call not found',
        details: { callSid, userId }
      });
    }
    
    // 检查通话状态是否可以接听 - 更宽容的策略
    // 使用 endTime 或 startTime 来计算时间差，避免 NaN
    const baseTs = call.endTime || call.startTime;
    const timeSinceBase = baseTs ? (Date.now() - new Date(baseTs).getTime()) / 1000 : 0;
    
    // 记录当前状态和时间信息
    console.log('📞 Call acceptance check:', {
      callId: call.id,
      currentStatus: call.status,
      startTime: call.startTime,
      endTime: call.endTime,
      baseTs: baseTs,
      timeSinceBase: Math.round(timeSinceBase),
      timeWindow: '30s'
    });
    
    // 直接拒绝的状态（已完成或已取消）
    const prohibitedStatuses = ['completed', 'canceled'];
    if (prohibitedStatuses.includes(call.status)) {
      console.warn('📞 Call cannot be accepted - prohibited status:', {
        status: call.status,
        reason: 'Call is completed or canceled'
      });
      return res.status(400).json({
        success: false,
        message: `Call cannot be accepted. Status: ${call.status}`,
        currentStatus: call.status,
        reason: 'Call is completed or canceled'
      });
    }
    
    // 允许接听的状态
    const immediatelyAcceptableStatuses = ['ringing', 'queued', 'in-progress'];
    const recentlyEndedStatuses = ['no-answer', 'busy', 'failed'];
    
    let allowAccept = false;
    let acceptAfterTimeout = false;
    
    if (immediatelyAcceptableStatuses.includes(call.status)) {
      // 正常状态，直接允许
      allowAccept = true;
      console.log('📞 Call in acceptable status, allowing accept:', call.status);
    } else if (recentlyEndedStatuses.includes(call.status)) {
      // 最近结束的通话，检查30秒容错窗口
      if (timeSinceBase <= 30) {
        allowAccept = true;
        acceptAfterTimeout = false;
        console.log('📞 Call recently ended but within 30s window, allowing accept:', {
          status: call.status,
          baseTs: baseTs,
          timeSinceBase: Math.round(timeSinceBase),
          allowingGracePeriod: true
        });
      } else {
        console.warn('📞 Call ended too long ago, rejecting:', {
          status: call.status,
          baseTs: baseTs,
          timeSinceBase: Math.round(timeSinceBase),
          maxAllowed: 30
        });
        return res.status(400).json({
          success: false,
          message: `Call ended too long ago. Status: ${call.status}, ended ${Math.round(timeSinceBase)}s ago (max: 30s)`,
          currentStatus: call.status,
          timeSinceBase: Math.round(timeSinceBase),
          maxAllowedTime: 30
        });
      }
    } else {
      // 其他未知状态，也允许尝试（更宽容）
      console.log('📞 Unknown status, allowing accept with caution:', call.status);
      allowAccept = true;
    }
    
    if (!allowAccept) {
      console.error('📞 Accept logic error - should not reach here');
      return res.status(400).json({
        success: false,
        message: 'Internal error in call acceptance logic',
        currentStatus: call.status
      });
    }
    
    // Update call status to in-progress - 记录详细的状态变更信息
    const originalStatus = call.status;
    // 根据30秒窗口设置acceptAfterTimeout
    const finalAcceptAfterTimeout = timeSinceBase > 30;
    const updateData = {
      status: 'in-progress',
      updatedAt: new Date(),
      metadata: {
        ...call.metadata,
        acceptedViaApi: true,
        acceptedAt: new Date().toISOString(),
        originalStatusBeforeAccept: originalStatus, // 记录接听前的状态
        acceptedAfterTimeout: finalAcceptAfterTimeout, // 标记是否在超时后接听
        timeSinceBaseWhenAccepted: Math.round(timeSinceBase), // 记录接听时距基准时间的时间
        acceptanceStrategy: finalAcceptAfterTimeout ? 'grace_period' : 'immediate' // 记录接听策略
      }
    };
    
    // 如果是从结束状态恢复，不修改endTime（保持原样）
    if (recentlyEndedStatuses.includes(originalStatus)) {
      console.log('📞 Call accepted after grace period (endTime preserved):', {
        originalStatus,
        timeSinceBase: Math.round(timeSinceBase)
      });
    }
    
    await call.update(updateData);
    
    console.log('✅ Call accepted and status updated in database:', {
      callId: call.id,
      callSid: call.callSid,
      originalStatus,
      newStatus: 'in-progress',
      acceptedAfterTimeout: finalAcceptAfterTimeout,
      timeSinceBase: Math.round(timeSinceBase)
    });
    
    // 🔧 简化语音连接逻辑 - 减少复杂性和出错概率
    try {
      // 通知前端通话已被接受，让前端处理连接
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('incomingCallAccepted', {
          callSid: callSid,
          callId: call.id,
          fromNumber: call.fromNumber,
          toNumber: call.toNumber,
          status: 'in-progress',
          originalStatus: originalStatus,
          acceptedAfterTimeout: finalAcceptAfterTimeout,
          timestamp: new Date().toISOString()
        });
        console.log('📡 Notified frontend about call acceptance via WebSocket:', {
          originalStatus,
          acceptedAfterTimeout: finalAcceptAfterTimeout
        });
      }
      
      // 简化方案：只更新状态，让前端Twilio SDK处理实际连接
      // 这避免了复杂的服务器端桥接逻辑，减少出错概率
      console.log('📞 Using simplified approach: frontend will handle voice connection');
      
    } catch (notificationError) {
      console.warn('⚠️ WebSocket notification failed (non-fatal):', notificationError);
      // 不阻断请求，即使WebSocket失败也继续
    }
    
    res.json({
      success: true,
      message: 'Call accepted successfully',
      callId: call.id,
      callSid: callSid,
      status: 'in-progress',
      originalStatus: originalStatus,
      acceptedAfterTimeout: finalAcceptAfterTimeout,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error accepting incoming call:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Request details:', { 
      callSid: req.body.callSid, 
      callId: req.body.callId, 
      userId: req.user?.userId 
    });
    
    // 根据错误类型返回更具体的错误信息
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({
        success: false,
        message: 'Database error while accepting call',
        errorType: 'database'
      });
    }
    
    if (error.message.includes('Twilio')) {
      return res.status(503).json({
        success: false,
        message: 'Voice service temporarily unavailable',
        errorType: 'twilio'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while accepting call',
      errorType: 'server',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 语音桥接处理 - 用于连接来电接听
router.post('/voice-bridge', async (req, res) => {
  console.log('🌉 ===== VOICE BRIDGE WEBHOOK =====');
  console.log('🌉 Voice bridge webhook triggered');
  
  try {
    // 设置响应头
    res.type('text/xml');
    
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const response = new VoiceResponse();
    
    // 记录请求信息
    console.log('🌉 Bridge request body:', JSON.stringify(req.body, null, 2));
    
    const body = req.body || {};
    const { To, From, CallSid } = body;
    
    console.log('🌉 Bridge parameters:', { To, From, CallSid });
    
    // 对于语音桥接，我们创建一个会议室来连接双方
    const conferenceName = `bridge_${CallSid}_${Date.now()}`;
    
    // 将通话连接到会议室
    const dial = response.dial();
    dial.conference(conferenceName, {
      startConferenceOnEnter: true,
      endConferenceOnExit: false,
      waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient',
      statusCallback: `${process.env.APP_URL}/api/twilio/conference-status`,
      statusCallbackEvent: ['start', 'end', 'join', 'leave'],
      statusCallbackMethod: 'POST'
    });
    
    console.log('🌉 Created conference:', conferenceName);
    
    // 生成TwiML响应
    const twimlResponse = response.toString();
    console.log('🌉 Bridge TwiML response:', twimlResponse);
    console.log('🌉 =============================');
    
    res.status(200).send(twimlResponse);
    
  } catch (error) {
    console.error('❌ Voice bridge error:', error);
    
    // 降级响应
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const fallbackResponse = new VoiceResponse();
    fallbackResponse.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Please try your call again.');
    
    res.type('text/xml');
    res.status(200).send(fallbackResponse.toString());
  }
});

// 会议状态回调
router.post('/conference-status', async (req, res) => {
  try {
    const { 
      ConferenceSid, 
      FriendlyName,
      StatusCallbackEvent,
      ParticipantLabel,
      CallSid
    } = req.body;
    
    console.log('🏁 Conference status:', {
      conference: ConferenceSid,
      name: FriendlyName,
      event: StatusCallbackEvent,
      participant: ParticipantLabel,
      callSid: CallSid
    });
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing conference status:', error);
    res.status(500).send('Error');
  }
});

module.exports = router; 