const twilio = require('twilio');

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

// 验证必要的Twilio配置
const isConfigured = accountSid && authToken && apiKey && apiSecret && twimlAppSid;

// 初始化Twilio客户端
let client = null;
if (isConfigured) {
  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized successfully');
    console.log(`📞 Twilio phone number: ${phoneNumber}`);
  } catch (error) {
    console.error('❌ Twilio client initialization failed:', error.message);
    console.log('⚠️ Voice calling will not be available');
  }
} else {
  console.error('❌ Twilio credentials are not configured');
  console.log('Missing configs:', {
    accountSid: !!accountSid,
    authToken: !!authToken,
    apiKey: !!apiKey,
    apiSecret: !!apiSecret,
    twimlAppSid: !!twimlAppSid
  });
  console.log('⚠️ Voice calling functionality will not be available');
}

// 生成访问令牌
const generateAccessToken = (identity) => {
  if (!isConfigured) {
    throw new Error('Twilio configuration is required for voice calling functionality');
  }

  try {
    console.log('🔑 开始生成 Token, identity:', identity);
    console.log('🔑 使用配置:', {
      accountSid: accountSid ? accountSid.substring(0, 10) + '...' : 'Missing',
      apiKey: apiKey ? apiKey.substring(0, 10) + '...' : 'Missing',
      twimlAppSid: twimlAppSid ? twimlAppSid.substring(0, 10) + '...' : 'Missing'
    });
    
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    // 创建访问令牌 - 增加调试信息
    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity,
      ttl: 3600, // 1小时过期
      region: 'us1' // 显式指定区域
    });

    // 创建语音授权
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true // 允许接收来电
    });

    token.addGrant(voiceGrant);
    
    const jwtToken = token.toJwt();
    
    // 验证生成的 Token
    console.log('🔍 验证生成的 Token:');
    const parts = jwtToken.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('- Identity:', payload.grants?.identity || payload.identity);
        console.log('- 过期时间:', new Date(payload.exp * 1000).toLocaleString());
        console.log('- 语音授权:', !!payload.grants?.voice);
        console.log('- TwiML App SID:', payload.grants?.voice?.outgoing?.application_sid);
      } catch (parseError) {
        console.warn('⚠️ Token 解析警告:', parseError.message);
      }
    }
    
    console.log('✅ Generated access token for:', identity);
    return jwtToken;
  } catch (error) {
    console.error('❌ Failed to generate access token:', error.message);
    console.error('❌ Error details:', error);
    throw new Error('Failed to generate Twilio access token');
  }
};

// 获取通话费率
const getCallRates = async (fromCountry, toCountry) => {
  const axios = require('axios');
  
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000); // 5 second timeout

    try {
      // Make request to Twilio pricing API
      const response = await axios.get(
        `https://pricing.twilio.com/v1/Voice/Countries/${toCountry}`,
        {
          auth: {
            username: accountSid,
            password: authToken
          },
          signal: controller.signal,
          timeout: 5000 // Also set axios timeout
        }
      );

      clearTimeout(timeout);

      // Extract rates from response
      const data = response.data;
      const outboundRate = data.outbound_prefix_prices?.[0]?.base_price || 0.02;

      return {
        outboundRate: parseFloat(outboundRate),
        currency: data.price_unit || 'USD',
        fromCountry,
        toCountry,
        fallback: false
      };
    } catch (error) {
      clearTimeout(timeout);
      
      // Log specific error details
      let errorMessage = 'Unknown error';
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'ECONNABORTED (timeout)';
      } else if (error.code === 'ERR_CANCELED') {
        errorMessage = 'ERR_CANCELED (aborted)';
      } else if (error.response) {
        errorMessage = `HTTP ${error.response.status}`;
      } else if (error.code) {
        errorMessage = error.code;
      }

      console.log(`❌ Twilio rate fetch failed for ${toCountry}: ${errorMessage}`);

      // Return fallback rates
      return {
        outboundRate: 0.02,
        currency: 'USD',
        fromCountry,
        toCountry,
        fallback: true
      };
    }
  } catch (error) {
    // Catch any other errors (like missing axios)
    console.log(`❌ Twilio rate fetch failed for ${toCountry}: ${error.message}`);
    
    return {
        outboundRate: 0.02,
        currency: 'USD',
        fromCountry,
        toCountry,
        fallback: true
      };
  }
};

// 发起呼叫 - 修复版本
const makeCall = async (from, to, callbackUrl) => {
  if (!client) {
    throw new Error('Twilio client not initialized. Voice calling requires Twilio configuration.');
  }

  try {
    console.log('📞 Making call from', from, 'to', to);
    console.log('📞 Using callback URL:', callbackUrl);

    // 使用配置的Twilio电话号码作为发送方
    const fromNumber = phoneNumber || from;

    // 🔧 修复：使用TwiML应用进行通话，而不是直接API调用
    const baseUrl = process.env.APP_URL || 'https://ubophone.com';

    console.log('📞 Using TwiML Application SID:', twimlAppSid);

    const call = await client.calls.create({
      from: fromNumber,
      to: to, // 🔧 修复：直接拨打目标号码
      applicationSid: twimlAppSid, // 🔧 关键修复：使用TwiML应用而不是URL
      record: false, // 禁用录音以提高稳定性
      // 实时质量监控回调 - 修复事件配置
      statusCallback: `${baseUrl}/api/twilio/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      // 增强音频质量设置
      machineDetection: 'none', // 完全禁用机器检测
      timeout: 30, // 响铃超时时间
      timeLimit: 3600, // 1小时最大通话时间
      // 稳定性增强
      trim: 'trim-silence' // 自动修剪静音
    });

    console.log('✅ Call initiated:', call.sid);
    console.log('📞 Call details:', {
      sid: call.sid,
      from: call.from,
      to: call.to,
      status: call.status
    });

    return {
      success: true,
      callSid: call.sid,
      status: call.status,
      from: call.from,
      to: call.to
    };
  } catch (error) {
    console.error('❌ Error making call:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
      status: error.status
    });

    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      moreInfo: error.moreInfo
    };
  }
};

// 获取通话记录
const getCallLogs = async (accountSid, limit = 50) => {
  if (!client) {
    console.warn('Twilio client not available for call logs');
    return [];
  }

  try {
    const calls = await client.calls.list({
      limit: limit
    });

    return calls.map(call => ({
      sid: call.sid,
      from: call.from,
      to: call.to,
      status: call.status,
      duration: call.duration,
      price: call.price,
      priceUnit: call.priceUnit,
      startTime: call.startTime,
      endTime: call.endTime
    }));
  } catch (error) {
    console.error('Error getting call logs:', error);
    return [];
  }
};

// 获取通话质量指标
const getCallQualityMetrics = async (callSid) => {
  if (!client) {
    return {
      success: false,
      error: 'Twilio client not available'
    };
  }

  try {
    // Get call details with quality metrics
    const call = await client.calls(callSid).fetch();
    
    // In a real implementation, you would fetch actual quality metrics
    // For now, we'll simulate the data structure
    const metrics = {
      audioQuality: {
        mos: 4.0, // Mean Opinion Score - would come from Twilio Insights
        jitter: 8,
        latency: 95,
        packetLoss: 0.5,
        audioLevel: 65,
        echoCancellation: true,
        noiseSuppression: true
      },
      networkAnalysis: {
        connectionType: 'WiFi',
        signalStrength: 85,
        bandwidth: 1.2,
        codecUsed: call.codec || 'OPUS',
        rtpStats: {
          packetsLost: 2,
          packetsReceived: 1250,
          jitter: 8
        }
      }
    };

    return {
      success: true,
      metrics
    };
  } catch (error) {
    console.error('Error getting call quality metrics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 获取录音质量分析
const analyzeRecordingQuality = async (recordingSid) => {
  if (!client) {
    return {
      success: false,
      error: 'Twilio client not available'
    };
  }

  try {
    // Get recording details
    const recording = await client.recordings(recordingSid).fetch();
    
    // In a real implementation, you would use audio analysis services
    // like AWS Transcribe, Google Speech-to-Text, or custom ML models
    const analysis = {
      qualityScore: 8.0, // Overall quality score out of 10
      clarity: 7.8,
      backgroundNoise: 'Low',
      speechQuality: 8.2,
      audioDistortion: 0.2,
      fileSize: recording.fileSize || 1024000,
      duration: recording.duration || 0,
      format: 'mp3',
      channels: recording.channels || 1,
      recommendations: []
    };

    // Add recommendations based on analysis
    if (analysis.clarity < 7) {
      analysis.recommendations.push('Consider using a better microphone for clearer audio');
    }
    if (analysis.backgroundNoise === 'High') {
      analysis.recommendations.push('Use noise cancellation or move to a quieter environment');
    }
    if (analysis.speechQuality < 7) {
      analysis.recommendations.push('Speak more clearly and maintain consistent volume');
    }

    return {
      success: true,
      analysis
    };
  } catch (error) {
    console.error('Error analyzing recording quality:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 实时通话质量监控
const startQualityMonitoring = async (callSid, callback) => {
  try {
    // In a real implementation, you would use Twilio's real-time API
    // or WebSocket connections to get live quality metrics
    return {
      success: true,
      message: 'Real-time monitoring not implemented for production calls'
    };
  } catch (error) {
    console.error('Error starting quality monitoring:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 生成通话质量报告
const generateQualityReport = async (callSids) => {
  try {
    const reports = [];
    
    for (const callSid of callSids) {
      const qualityMetrics = await getCallQualityMetrics(callSid);
      if (qualityMetrics.success) {
        reports.push({
          callSid,
          ...qualityMetrics.metrics
        });
      }
    }
    
    // Calculate aggregate metrics
    const aggregateReport = {
      totalCalls: reports.length,
      averageMOS: reports.reduce((sum, r) => sum + r.audioQuality.mos, 0) / reports.length,
      averageJitter: reports.reduce((sum, r) => sum + r.audioQuality.jitter, 0) / reports.length,
      averageLatency: reports.reduce((sum, r) => sum + r.audioQuality.latency, 0) / reports.length,
      averagePacketLoss: reports.reduce((sum, r) => sum + r.audioQuality.packetLoss, 0) / reports.length,
      qualityDistribution: {
        excellent: reports.filter(r => r.audioQuality.mos >= 4.0).length,
        good: reports.filter(r => r.audioQuality.mos >= 3.5 && r.audioQuality.mos < 4.0).length,
        fair: reports.filter(r => r.audioQuality.mos >= 3.0 && r.audioQuality.mos < 3.5).length,
        poor: reports.filter(r => r.audioQuality.mos < 3.0).length
      },
      commonIssues: [],
      recommendations: []
    };
    
    // Add recommendations based on aggregate data
    if (aggregateReport.averageMOS < 3.5) {
      aggregateReport.recommendations.push('Overall call quality is below acceptable levels. Consider network optimization.');
    }
    if (aggregateReport.averageJitter > 15) {
      aggregateReport.recommendations.push('High network jitter detected. Check network stability.');
    }
    if (aggregateReport.averagePacketLoss > 1) {
      aggregateReport.recommendations.push('Packet loss is affecting call quality. Investigate network issues.');
    }
    
    return {
      success: true,
      report: aggregateReport,
      detailed: reports
    };
  } catch (error) {
    console.error('Error generating quality report:', error);
    return {
      success: false,
      error: error.message
    };
  }
};



module.exports = {
  client,
  isConfigured,
  generateAccessToken,
  getCallRates,
  makeCall,
  getCallLogs,
  getCallQualityMetrics,
  analyzeRecordingQuality,
  startQualityMonitoring,
  generateQualityReport
}; 