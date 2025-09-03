const express = require('express');
const { UserPhoneNumber, User, IncomingCall, Payment, sequelize } = require('../models');
const auth = require('../middleware/auth');
const { client: twilioClient } = require('../config/twilio');
const { getPhoneNumberLocation } = require('../utils/phoneLocation');

const router = express.Router();

// 获取用户的电话号码列表
router.get('/', auth, async (req, res) => {
  try {
    // 获取用户的默认来电显示设置
    const user = await User.findByPk(req.user.userId, {
      attributes: ['defaultCallerId']
    });

    const phoneNumbers = await UserPhoneNumber.findAll({
      where: { userId: req.user.userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: IncomingCall,
          as: 'incomingCalls',
          attributes: ['id', 'status', 'startTime'],
          limit: 5,
          order: [['startTime', 'DESC']],
          required: false
        }
      ]
    });

    // 格式化响应数据
    const formattedNumbers = phoneNumbers.map(phone => ({
      id: phone.id,
      phoneNumber: phone.phoneNumber,
      type: phone.type,
      status: phone.status,
      callerIdName: phone.callerIdName,
      monthlyFee: parseFloat(phone.monthlyFee),
      setupFee: parseFloat(phone.setupFee),
      purchaseDate: phone.purchaseDate,
      expiryDate: phone.expiryDate,
      capabilities: phone.capabilities,
      // 地理位置信息
      locality: phone.locality,
      region: phone.region,
      isoCountry: phone.isoCountry,
      // 新增：布尔字段显示是否为默认来电显示
      isDefaultCallerId: phone.isDefaultCallerId || false,
      // 标签和备注
      label: phone.label,
      notes: phone.notes,
      settings: {
        forwardingEnabled: phone.forwardingEnabled,
        forwardingNumber: phone.forwardingNumber,
        voicemailEnabled: phone.voicemailEnabled,
        autoAnswer: phone.autoAnswer,
        businessHours: phone.businessHours,
        customGreeting: phone.customGreeting
      },
      statistics: {
        totalIncomingCalls: phone.totalAnsweredCalls || 0,
        totalIncomingMinutes: Math.ceil((phone.totalIncomingSeconds || 0) / 60),
        lastIncomingCall: phone.lastIncomingCall
      },
      recentCalls: phone.incomingCalls || []
    }));

    res.json({
      success: true,
      phoneNumbers: formattedNumbers,
      defaultCallerId: user?.defaultCallerId || null,
      total: formattedNumbers.length
    });

  } catch (error) {
    console.error('Error fetching phone numbers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch phone numbers'
    });
  }
});

// 获取可购买的号码列表（从Twilio）
router.get('/available', auth, async (req, res) => {
  try {
    const { countryCode = 'US', areaCode, contains } = req.query;
    
    // 只允许美国和加拿大
    if (!['US', 'CA'].includes(countryCode)) {
      return res.status(400).json({
        success: false,
        message: 'Phone numbers are only available for US and Canada'
      });
    }
    
    // 模拟数据 - 在生产环境中应该调用Twilio API
    if (process.env.NODE_ENV === 'development' || !twilioClient) {
      // 生成模拟的可用号码
      const mockNumbers = [];
      for (let i = 0; i < 10; i++) {
        const areaCodePrefix = areaCode || '555';
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const randomMiddle = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const phoneNumber = `+1${areaCodePrefix}${randomMiddle}${randomSuffix}`;
        
        // 使用地理位置工具获取位置信息
        const locationInfo = getPhoneNumberLocation(phoneNumber);
        
        mockNumbers.push({
          phoneNumber,
          friendlyName: `(${areaCodePrefix}) ${randomMiddle}-${randomSuffix}`,
          locality: locationInfo.locality,
          region: locationInfo.region,
          isoCountry: locationInfo.isoCountry,
          capabilities: {
            voice: true,
            sms: true,
            mms: false,
            fax: false
          },
          monthlyFee: 2.00,
          setupFee: 0.00
        });
      }
      
      return res.json({
        success: true,
        availableNumbers: mockNumbers,
        total: mockNumbers.length
      });
    }

    // 实际的Twilio API调用
    const searchParams = {
      countryCode,
      limit: 20
    };
    
    if (areaCode) {
      searchParams.areaCode = areaCode;
    }
    
    if (contains) {
      searchParams.contains = contains;
    }

    const availableNumbers = await twilioClient.availablePhoneNumbers(countryCode)
      .local
      .list(searchParams);

    const formattedNumbers = availableNumbers.map(number => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      locality: number.locality,
      region: number.region,
      isoCountry: number.isoCountry,
      capabilities: number.capabilities,
      monthlyFee: 2.00, // 更新费率
      setupFee: 0.00
    }));

    res.json({
      success: true,
      availableNumbers: formattedNumbers,
      total: formattedNumbers.length
    });

  } catch (error) {
    console.error('Error fetching available numbers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available numbers'
    });
  }
});

// 购买电话号码
router.post('/purchase', auth, async (req, res) => {
  // 启动数据库事务
  const transaction = await sequelize.transaction();
  
  try {
    const { phoneNumber, callerIdName } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    console.log(`📞 Starting purchase process for ${phoneNumber} by user ${req.user.userId}`);

    // 检查用户余额
    const user = await User.findByPk(req.user.userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const setupFee = 0.00;
    const monthlyFee = 2.00;
    const totalCost = setupFee + monthlyFee;
    
    console.log(`💰 User balance: $${user.balance}, Required: $${totalCost}`);
    
    if (parseFloat(user.balance) < totalCost) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance. Please add credits.'
      });
    }

    // 检查号码是否已被购买
    const existingNumber = await UserPhoneNumber.findOne({
      where: { phoneNumber },
      transaction
    });

    if (existingNumber) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'This phone number is already taken'
      });
    }

    let twilioSid = null;
    
    // 判断是否为模拟购买：只有在明确设置SIMULATE_PURCHASE=true时才模拟，否则都正常扣费
    const isSimulatedPurchase = process.env.SIMULATE_PURCHASE === 'true';
    if (isSimulatedPurchase) {
      console.log('🔧 Simulated mode: Mock phone number purchase (no real charge)');
      twilioSid = `PN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    } else if (!twilioClient) {
      console.log('🔧 Twilio not configured: Mock purchase but WILL charge real money');
      twilioSid = `PN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    } else {
      try {
        console.log('📱 Purchasing number from Twilio...');
        // 实际从Twilio购买号码
        const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
          phoneNumber: phoneNumber,
          voiceUrl: `${process.env.APP_URL || process.env.BASE_URL || 'https://ubophone.com'}/api/incoming-calls/webhook/voice`,
          voiceMethod: 'POST',
          statusCallback: `${process.env.APP_URL || process.env.BASE_URL || 'https://ubophone.com'}/api/incoming-calls/webhook/dial-status`,
          statusCallbackMethod: 'POST'
        });
        
        twilioSid = purchasedNumber.sid;
        console.log(`✅ Successfully purchased from Twilio: ${twilioSid}`);
      } catch (twilioError) {
        console.error('❌ Twilio purchase error:', twilioError);
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Failed to purchase number: ${twilioError.message}`
        });
      }
    }

    // 获取电话号码的地理位置信息
    const locationInfo = getPhoneNumberLocation(phoneNumber);
    
    console.log('📍 Location info:', locationInfo);
    
    // 在数据库中创建记录（在事务中）
    const userPhoneNumber = await UserPhoneNumber.create({
      userId: req.user.userId,
      phoneNumber,
      type: 'dedicated',
      status: 'active',
      twilioSid,
      locality: locationInfo.locality,
      region: locationInfo.region,
      isoCountry: locationInfo.isoCountry,
      callerIdName: callerIdName || `${user.firstName || user.username}'s Phone`,
      monthlyFee,
      setupFee,
      purchaseDate: new Date()
    }, { transaction });

    console.log(`✅ Phone number record created: ${userPhoneNumber.id}`);

    // 扣除费用（在事务中）
    let newBalance;
    if (isSimulatedPurchase) {
      // 仅在SIMULATE_PURCHASE=true时不扣费
      newBalance = parseFloat(user.balance);
      console.log(`💳 Simulated mode: Balance unchanged at $${newBalance} (no real charge)`);
    } else {
      // 正常扣除费用（包括Twilio未配置的情况）
      newBalance = parseFloat(user.balance) - totalCost;
      await user.update({
        balance: newBalance
      }, { transaction });
      console.log(`💳 Balance updated: $${user.balance} -> $${newBalance} (charged $${totalCost})`);
      
      // 创建Payment记录
      await Payment.create({
        userId: req.user.userId,
        type: 'phone_purchase',
        amount: totalCost,
        status: 'completed',
        description: `Phone number purchase: ${phoneNumber}`,
        phoneNumber: phoneNumber,
        paymentMethod: 'balance',
        transactionId: `phone_${userPhoneNumber.id}`,
        metadata: {
          phoneNumber: phoneNumber,
          twilioSid: twilioSid,
          setupFee: setupFee,
          monthlyFee: monthlyFee,
          locality: locationInfo.locality,
          region: locationInfo.region,
          isoCountry: locationInfo.isoCountry
        }
      }, { transaction });
      
      console.log(`📝 Payment record created for phone number purchase`);
    }

    // 提交事务
    await transaction.commit();
    console.log('✅ Transaction committed successfully');

    // 格式化响应
    const responseData = {
      id: userPhoneNumber.id,
      phoneNumber: userPhoneNumber.phoneNumber,
      callerIdName: userPhoneNumber.callerIdName,
      type: userPhoneNumber.type,
      status: userPhoneNumber.status,
      monthlyFee: parseFloat(userPhoneNumber.monthlyFee),
      setupFee: parseFloat(userPhoneNumber.setupFee),
      purchaseDate: userPhoneNumber.purchaseDate,
      remainingBalance: newBalance
    };

    res.json({
      success: true,
      phoneNumber: responseData,
      message: isSimulatedPurchase 
        ? `Phone number ${phoneNumber} purchased successfully (Simulated - no charge)` 
        : `Phone number ${phoneNumber} purchased successfully`,
      totalCost: isSimulatedPurchase ? 0 : totalCost,
      isSimulated: isSimulatedPurchase
    });

  } catch (error) {
    // 回滚事务
    try {
      await transaction.rollback();
      console.log('🔄 Transaction rolled back due to error');
    } catch (rollbackError) {
      console.error('❌ Failed to rollback transaction:', rollbackError);
    }
    
    console.error('❌ Error purchasing phone number:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.userId,
      phoneNumber: req.body.phoneNumber
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to purchase phone number. Please try again.'
    });
  }
});

// 更新电话号码设置
router.put('/:id/settings', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      callerIdName,
      forwardingEnabled,
      forwardingNumber,
      voicemailEnabled,
      autoAnswer,
      businessHours,
      customGreeting
    } = req.body;

    const phoneNumber = await UserPhoneNumber.findOne({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!phoneNumber) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found'
      });
    }

    // 更新设置
    const updateData = {};
    if (callerIdName !== undefined) updateData.callerIdName = callerIdName;
    if (forwardingEnabled !== undefined) updateData.forwardingEnabled = forwardingEnabled;
    if (forwardingNumber !== undefined) updateData.forwardingNumber = forwardingNumber;
    if (voicemailEnabled !== undefined) updateData.voicemailEnabled = voicemailEnabled;
    if (autoAnswer !== undefined) updateData.autoAnswer = autoAnswer;
    if (businessHours !== undefined) updateData.businessHours = businessHours;
    if (customGreeting !== undefined) updateData.customGreeting = customGreeting;

    await phoneNumber.update(updateData);

    res.json({
      success: true,
      phoneNumber: {
        id: phoneNumber.id,
        phoneNumber: phoneNumber.phoneNumber,
        callerIdName: phoneNumber.callerIdName,
        settings: {
          forwardingEnabled: phoneNumber.forwardingEnabled,
          forwardingNumber: phoneNumber.forwardingNumber,
          voicemailEnabled: phoneNumber.voicemailEnabled,
          autoAnswer: phoneNumber.autoAnswer,
          businessHours: phoneNumber.businessHours,
          customGreeting: phoneNumber.customGreeting
        }
      },
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating phone number settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// 🔧 更新来电处理设置
router.put('/:id/incoming-settings', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      incomingCallMode,
      forwardingEnabled,
      forwardingNumber
    } = req.body;

    const phoneNumber = await UserPhoneNumber.findOne({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!phoneNumber) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found'
      });
    }

    // 验证输入数据
    if (incomingCallMode && !['forward', 'browser'].includes(incomingCallMode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid incoming call mode. Must be "forward" or "browser"'
      });
    }

    if (incomingCallMode === 'forward' && forwardingEnabled && !forwardingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Forwarding number is required when forwarding is enabled'
      });
    }

    // 构建更新数据
    const updateData = {};
    if (forwardingEnabled !== undefined) updateData.forwardingEnabled = forwardingEnabled;
    if (forwardingNumber !== undefined) updateData.forwardingNumber = forwardingNumber;

    // 根据模式设置相应的字段
    if (incomingCallMode === 'forward') {
      updateData.forwardingEnabled = true;
      updateData.forwardingNumber = forwardingNumber;
    } else if (incomingCallMode === 'browser') {
      updateData.forwardingEnabled = false;
      updateData.forwardingNumber = null;
    }

    await phoneNumber.update(updateData);

    console.log(`📞 Updated incoming call settings for ${phoneNumber.phoneNumber}:`, {
      mode: incomingCallMode,
      forwardingEnabled: updateData.forwardingEnabled,
      forwardingNumber: updateData.forwardingNumber
    });

    res.json({
      success: true,
      phoneNumber: {
        id: phoneNumber.id,
        phoneNumber: phoneNumber.phoneNumber,
        settings: {
          forwardingEnabled: phoneNumber.forwardingEnabled,
          forwardingNumber: phoneNumber.forwardingNumber,
          voicemailEnabled: phoneNumber.voicemailEnabled,
          autoAnswer: phoneNumber.autoAnswer,
          businessHours: phoneNumber.businessHours,
          customGreeting: phoneNumber.customGreeting
        }
      },
      message: 'Incoming call settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating incoming call settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update incoming call settings'
    });
  }
});

// 删除/释放电话号码
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const phoneNumber = await UserPhoneNumber.findOne({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!phoneNumber) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found'
      });
    }

    // 在生产环境中释放Twilio号码
    if (phoneNumber.twilioSid && twilioClient && process.env.NODE_ENV !== 'development') {
      try {
        await twilioClient.incomingPhoneNumbers(phoneNumber.twilioSid).remove();
      } catch (twilioError) {
        console.error('Failed to release Twilio number:', twilioError);
        // 即使Twilio释放失败，也继续删除数据库记录
      }
    }

    // 将状态设为 inactive 而不是直接删除（保留历史记录）
    await phoneNumber.update({
      status: 'inactive',
      expiryDate: new Date()
    });

    res.json({
      success: true,
      message: `Phone number ${phoneNumber.phoneNumber} has been released`
    });

  } catch (error) {
    console.error('Error releasing phone number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release phone number'
    });
  }
});

// 获取号码的来电历史
router.get('/:id/incoming-calls', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const phoneNumber = await UserPhoneNumber.findOne({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!phoneNumber) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found'
      });
    }

    const whereClause = {
      userPhoneNumberId: id
    };

    if (status) {
      whereClause.status = status;
    }

    const calls = await IncomingCall.findAndCountAll({
      where: whereClause,
      order: [['startTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id', 'callSid', 'fromNumber', 'status', 'startTime', 
        'answerTime', 'endTime', 'duration', 'handledBy',
        'hasRecording', 'hasVoicemail', 'isSpam', 'userNotes'
      ]
    });

    res.json({
      success: true,
      phoneNumber: phoneNumber.phoneNumber,
      calls: calls.rows,
      pagination: {
        total: calls.count,
        totalPages: Math.ceil(calls.count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching incoming calls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incoming calls'
    });
  }
});

// 设置默认来电显示号码
router.post('/default-caller-id', auth, async (req, res) => {
  try {
    const { phoneNumberId } = req.body;

    // 获取用户
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 如果设置为null，表示清除默认来电显示
    if (phoneNumberId === null) {
      // 清除用户的默认来电显示设置
      await user.update({ defaultCallerId: null });
      
      // 将该用户的所有号码的isDefaultCallerId设为false
      await UserPhoneNumber.update(
        { isDefaultCallerId: false },
        { where: { userId: req.user.userId } }
      );
      
      return res.json({
        success: true,
        defaultCallerId: null,
        message: 'Default caller ID removed'
      });
    }

    // 验证电话号码是否属于该用户
    const phoneNumber = await UserPhoneNumber.findOne({
      where: {
        id: phoneNumberId,
        userId: req.user.userId,
        status: 'active' // 只有活跃的号码才能设为默认
      }
    });

    if (!phoneNumber) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found or not active'
      });
    }

    // 🔄 同步更新两种方案：
    // 方案1：更新users表的defaultCallerId字段
    await user.update({ defaultCallerId: phoneNumberId });
    
    // 方案2：更新user_phone_numbers表的布尔字段
    // 先将该用户的所有号码设为非默认
    await UserPhoneNumber.update(
      { isDefaultCallerId: false },
      { where: { userId: req.user.userId } }
    );
    
    // 然后将选中的号码设为默认
    await UserPhoneNumber.update(
      { isDefaultCallerId: true },
      { where: { id: phoneNumberId, userId: req.user.userId } }
    );

    res.json({
      success: true,
      defaultCallerId: phoneNumberId,
      phoneNumber: phoneNumber.phoneNumber,
      message: `Default caller ID set to ${phoneNumber.phoneNumber}`
    });

  } catch (error) {
    console.error('Error setting default caller ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default caller ID'
    });
  }
});

// 🔧 临时修复：更新现有号码的webhook配置
router.post('/fix-webhook/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const phoneNumber = await UserPhoneNumber.findOne({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!phoneNumber) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found'
      });
    }

    if (!phoneNumber.twilioSid) {
      return res.status(400).json({
        success: false,
        message: 'No Twilio SID found for this number'
      });
    }

    // 更新Twilio号码的webhook配置
    const { client: twilioClient } = require('../config/twilio');
    
    const updatedNumber = await twilioClient.incomingPhoneNumbers(phoneNumber.twilioSid).update({
      voiceUrl: `${process.env.APP_URL || process.env.BASE_URL || 'https://ubophone.com'}/api/incoming-calls/webhook/voice`,
      voiceMethod: 'POST',
      statusCallback: `${process.env.APP_URL || process.env.BASE_URL || 'https://ubophone.com'}/api/incoming-calls/webhook/dial-status`,
      statusCallbackMethod: 'POST'
    });

    console.log('🔧 Updated webhook configuration for number:', phoneNumber.phoneNumber);

    res.json({
      success: true,
      message: 'Webhook configuration updated successfully',
      phoneNumber: phoneNumber.phoneNumber,
      newVoiceUrl: updatedNumber.voiceUrl,
      newStatusCallback: updatedNumber.statusCallback
    });

  } catch (error) {
    console.error('Error updating webhook configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update webhook configuration',
      error: error.message
    });
  }
});

// 🔧 临时修复：获取所有号码及其webhook状态
router.get('/webhook-status', auth, async (req, res) => {
  try {
    const phoneNumbers = await UserPhoneNumber.findAll({
      where: { userId: req.user.userId },
      attributes: ['id', 'phoneNumber', 'twilioSid', 'status']
    });

    const { client: twilioClient } = require('../config/twilio');
    const numbersWithStatus = [];

    for (const phoneNumber of phoneNumbers) {
      if (phoneNumber.twilioSid) {
        try {
          const twilioNumber = await twilioClient.incomingPhoneNumbers(phoneNumber.twilioSid).fetch();
          numbersWithStatus.push({
            id: phoneNumber.id,
            phoneNumber: phoneNumber.phoneNumber,
            twilioSid: phoneNumber.twilioSid,
            currentVoiceUrl: twilioNumber.voiceUrl,
            currentStatusCallback: twilioNumber.statusCallback,
            needsUpdate: !twilioNumber.voiceUrl.includes('/api/incoming-calls/')
          });
        } catch (twilioError) {
          numbersWithStatus.push({
            id: phoneNumber.id,
            phoneNumber: phoneNumber.phoneNumber,
            twilioSid: phoneNumber.twilioSid,
            error: 'Could not fetch from Twilio',
            needsUpdate: true
          });
        }
      } else {
        numbersWithStatus.push({
          id: phoneNumber.id,
          phoneNumber: phoneNumber.phoneNumber,
          twilioSid: null,
          error: 'No Twilio SID',
          needsUpdate: false
        });
      }
    }

    res.json({
      success: true,
      phoneNumbers: numbersWithStatus,
      fixEndpoint: '/api/phone-numbers/fix-webhook/:id'
    });

  } catch (error) {
    console.error('Error checking webhook status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check webhook status',
      error: error.message
    });
  }
});

// 更新电话号码标签和备注
router.put('/:phoneNumberId/labels', auth, async (req, res) => {
  try {
    const { phoneNumberId } = req.params;
    const { label, notes } = req.body;

    // 验证电话号码是否属于该用户
    const phoneNumber = await UserPhoneNumber.findOne({
      where: {
        id: phoneNumberId,
        userId: req.user.userId
      }
    });

    if (!phoneNumber) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found'
      });
    }

    // 更新标签和备注
    await phoneNumber.update({
      label: label && label.trim() ? label.trim() : null,
      notes: notes && notes.trim() ? notes.trim() : null
    });

    console.log(`📝 Updated labels for ${phoneNumber.phoneNumber}:`, {
      label: phoneNumber.label,
      notes: phoneNumber.notes
    });

    res.json({
      success: true,
      message: 'Labels and notes updated successfully',
      phoneNumber: {
        id: phoneNumber.id,
        phoneNumber: phoneNumber.phoneNumber,
        label: phoneNumber.label,
        notes: phoneNumber.notes
      }
    });

  } catch (error) {
    console.error('Error updating phone number labels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update labels and notes'
    });
  }
});

// 🔧 简单修复：一键修复所有webhook（无需认证的临时端点）
router.post('/fix-all-webhooks-temp', async (req, res) => {
  try {
    console.log('🔧 Starting batch webhook fix...');
    
    // 获取所有需要修复的号码
    const phoneNumbers = await UserPhoneNumber.findAll({
      where: { status: 'active' },
      attributes: ['id', 'phoneNumber', 'twilioSid', 'userId']
    });

    const { client: twilioClient } = require('../config/twilio');
    const results = [];
    let fixedCount = 0;
    let errorCount = 0;

    for (const phoneNumber of phoneNumbers) {
      if (phoneNumber.twilioSid) {
        try {
          // 检查当前webhook状态
          const twilioNumber = await twilioClient.incomingPhoneNumbers(phoneNumber.twilioSid).fetch();
          const needsUpdate = !twilioNumber.voiceUrl.includes('/api/incoming-calls/');
          
          if (needsUpdate) {
            // 更新webhook配置
            await twilioClient.incomingPhoneNumbers(phoneNumber.twilioSid).update({
              voiceUrl: `${process.env.APP_URL || process.env.BASE_URL || 'https://ubophone.com'}/api/incoming-calls/webhook/voice`,
              voiceMethod: 'POST',
              statusCallback: `${process.env.APP_URL || process.env.BASE_URL || 'https://ubophone.com'}/api/incoming-calls/webhook/dial-status`,
              statusCallbackMethod: 'POST'
            });
            
            results.push({
              phoneNumber: phoneNumber.phoneNumber,
              status: 'fixed',
              oldUrl: twilioNumber.voiceUrl,
              newUrl: `${process.env.APP_URL || process.env.BASE_URL}/api/incoming-calls/webhook/voice`
            });
            fixedCount++;
            console.log(`✅ Fixed webhook for ${phoneNumber.phoneNumber}`);
          } else {
            results.push({
              phoneNumber: phoneNumber.phoneNumber,
              status: 'already_correct',
              currentUrl: twilioNumber.voiceUrl
            });
            console.log(`✅ Webhook already correct for ${phoneNumber.phoneNumber}`);
          }
        } catch (twilioError) {
          results.push({
            phoneNumber: phoneNumber.phoneNumber,
            status: 'error',
            error: twilioError.message
          });
          errorCount++;
          console.error(`❌ Error fixing ${phoneNumber.phoneNumber}:`, twilioError.message);
        }
      } else {
        results.push({
          phoneNumber: phoneNumber.phoneNumber,
          status: 'no_twilio_sid'
        });
      }
    }

    console.log(`🔧 Batch fix completed: ${fixedCount} fixed, ${errorCount} errors`);

    res.json({
      success: true,
      message: `Webhook fix completed. Fixed: ${fixedCount}, Errors: ${errorCount}`,
      fixedCount,
      errorCount,
      totalNumbers: phoneNumbers.length,
      results
    });

  } catch (error) {
    console.error('Error in batch webhook fix:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix webhooks',
      error: error.message
    });
  }
});

// 📊 成本分析报告API
router.get('/cost-analysis', auth, async (req, res) => {
  try {
    const { period = 'month', year, month } = req.query;
    const userId = req.user.userId;

    // 获取用户的所有电话号码
    const phoneNumbers = await UserPhoneNumber.findAll({
      where: { userId },
      attributes: ['id', 'phoneNumber', 'monthlyFee', 'setupFee', 'purchaseDate', 'label', 'type', 'status']
    });

    if (phoneNumbers.length === 0) {
      return res.json({
        success: true,
        summary: {
          totalNumbers: 0,
          totalMonthlyCost: 0,
          totalYearlyCost: 0,
          averageCostPerNumber: 0
        },
        phoneNumbers: [],
        trends: [],
        recommendations: []
      });
    }

    // 计算时间范围
    let startDate, endDate;
    const now = new Date();
    
    if (period === 'month') {
      const targetYear = year ? parseInt(year) : now.getFullYear();
      const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
      startDate = new Date(targetYear, targetMonth, 1);
      endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    } else if (period === 'year') {
      const targetYear = year ? parseInt(year) : now.getFullYear();
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear, 11, 31, 23, 59, 59);
    } else {
      // 默认过去30天
      endDate = new Date();
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 优化：获取通话记录和费用数据，添加限制防止大量数据查询
    const [calls, payments] = await Promise.all([
      Call.findAll({
        where: {
          userId,
          startTime: {
            [sequelize.Op.between]: [startDate, endDate]
          }
        },
        attributes: ['id', 'fromNumber', 'toNumber', 'duration', 'cost', 'startTime', 'status'],
        order: [['startTime', 'DESC']],
        limit: 10000 // 限制最大查询数量，防止内存问题
      }),
      Payment.findAll({
        where: {
          userId,
          type: ['phone_purchase', 'credit_purchase'],
          createdAt: {
            [sequelize.Op.between]: [startDate, endDate]
          },
          status: 'completed'
        },
        attributes: ['amount', 'type', 'description', 'phoneNumber', 'createdAt'],
        limit: 1000 // 限制支付记录查询数量
      })
    ]);

    // 计算每个号码的详细成本分析
    const phoneNumberAnalysis = phoneNumbers.map(phone => {
      // 计算该号码在时间段内的通话费用
      const phoneCalls = calls.filter(call => 
        call.fromNumber === phone.phoneNumber || call.toNumber === phone.phoneNumber
      );

      const totalCallCost = phoneCalls.reduce((sum, call) => sum + parseFloat(call.cost || 0), 0);
      const totalCallDuration = phoneCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
      const totalCalls = phoneCalls.length;

      // 计算月租费（按时间段比例计算）
      const daysSincePurchase = Math.max(0, Math.floor((endDate - new Date(phone.purchaseDate)) / (1000 * 60 * 60 * 24)));
      const daysInPeriod = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
      const effectiveDays = Math.min(daysSincePurchase, daysInPeriod);
      const monthlyFeeProrated = parseFloat(phone.monthlyFee) * (effectiveDays / 30);

      // 计算ROI相关指标
      const totalCost = monthlyFeeProrated + totalCallCost;
      const costPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;
      const costPerMinute = totalCallDuration > 0 ? totalCost / (totalCallDuration / 60) : 0;

      // 使用效率分析
      const utilizationRate = totalCalls > 0 ? Math.min(100, (totalCalls / (effectiveDays || 1)) * 100) : 0;
      
      return {
        id: phone.id,
        phoneNumber: phone.phoneNumber,
        label: phone.label,
        type: phone.type,
        status: phone.status,
        costs: {
          monthlyFee: parseFloat(phone.monthlyFee),
          monthlyFeeProrated: monthlyFeeProrated,
          setupFee: parseFloat(phone.setupFee),
          callCost: totalCallCost,
          totalCost: totalCost
        },
        usage: {
          totalCalls,
          totalDuration: totalCallDuration,
          totalMinutes: Math.ceil(totalCallDuration / 60),
          utilizationRate: Math.round(utilizationRate * 100) / 100
        },
        efficiency: {
          costPerCall: Math.round(costPerCall * 10000) / 10000,
          costPerMinute: Math.round(costPerMinute * 100) / 100,
          roi: totalCalls > 0 ? 'positive' : 'negative'
        },
        purchaseDate: phone.purchaseDate,
        daysSincePurchase,
        effectiveDays
      };
    });

    // 计算总体摘要
    const summary = {
      totalNumbers: phoneNumbers.length,
      activeNumbers: phoneNumbers.filter(p => p.status === 'active').length,
      totalMonthlyCost: phoneNumberAnalysis.reduce((sum, p) => sum + p.costs.monthlyFeeProrated, 0),
      totalCallCost: phoneNumberAnalysis.reduce((sum, p) => sum + p.costs.callCost, 0),
      totalCost: phoneNumberAnalysis.reduce((sum, p) => sum + p.costs.totalCost, 0),
      totalCalls: phoneNumberAnalysis.reduce((sum, p) => sum + p.usage.totalCalls, 0),
      totalMinutes: phoneNumberAnalysis.reduce((sum, p) => sum + p.usage.totalMinutes, 0),
      averageCostPerNumber: phoneNumbers.length > 0 ? 
        phoneNumberAnalysis.reduce((sum, p) => sum + p.costs.totalCost, 0) / phoneNumbers.length : 0,
      averageUtilization: phoneNumbers.length > 0 ?
        phoneNumberAnalysis.reduce((sum, p) => sum + p.usage.utilizationRate, 0) / phoneNumbers.length : 0
    };

    // 生成使用趋势数据（按天）
    const trends = [];
    const dailyStats = {};
    
    calls.forEach(call => {
      const date = new Date(call.startTime).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { calls: 0, cost: 0, duration: 0 };
      }
      dailyStats[date].calls++;
      dailyStats[date].cost += parseFloat(call.cost || 0);
      dailyStats[date].duration += call.duration || 0;
    });

    // 填充趋势数据
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const stats = dailyStats[dateStr] || { calls: 0, cost: 0, duration: 0 };
      trends.push({
        date: dateStr,
        calls: stats.calls,
        cost: Math.round(stats.cost * 10000) / 10000,
        minutes: Math.ceil(stats.duration / 60)
      });
    }

    // 生成优化建议
    const recommendations = [];
    
    // 检查低使用率号码
    const lowUtilizationNumbers = phoneNumberAnalysis.filter(p => 
      p.usage.utilizationRate < 10 && p.daysSincePurchase > 7 && p.status === 'active'
    );
    
    if (lowUtilizationNumbers.length > 0) {
      recommendations.push({
        type: 'cost_optimization',
        priority: 'high',
        title: '考虑释放低使用率号码',
        description: `您有 ${lowUtilizationNumbers.length} 个号码使用率低于10%，考虑释放可节省月费`,
        potentialSavings: lowUtilizationNumbers.reduce((sum, p) => sum + p.costs.monthlyFee, 0),
        phoneNumbers: lowUtilizationNumbers.map(p => p.phoneNumber)
      });
    }

    // 检查高成本号码
    const highCostNumbers = phoneNumberAnalysis.filter(p => 
      p.costs.totalCost > summary.averageCostPerNumber * 2
    );
    
    if (highCostNumbers.length > 0) {
      recommendations.push({
        type: 'usage_analysis',
        priority: 'medium',
        title: '关注高成本号码',
        description: `${highCostNumbers.length} 个号码的成本显著高于平均水平，请检查使用模式`,
        phoneNumbers: highCostNumbers.map(p => p.phoneNumber)
      });
    }

    // 检查月费vs通话费比例
    const monthlyFeeRatio = summary.totalMonthlyCost / (summary.totalCost || 1);
    if (monthlyFeeRatio > 0.8) {
      recommendations.push({
        type: 'usage_optimization',
        priority: 'medium',
        title: '增加号码使用频率',
        description: '月租费占总成本的80%以上，建议增加通话使用以提高性价比'
      });
    }

    res.json({
      success: true,
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      },
      summary: {
        ...summary,
        totalMonthlyCost: Math.round(summary.totalMonthlyCost * 100) / 100,
        totalCallCost: Math.round(summary.totalCallCost * 100) / 100,
        totalCost: Math.round(summary.totalCost * 100) / 100,
        averageCostPerNumber: Math.round(summary.averageCostPerNumber * 100) / 100,
        averageUtilization: Math.round(summary.averageUtilization * 100) / 100
      },
      phoneNumbers: phoneNumberAnalysis,
      trends,
      recommendations
    });

  } catch (error) {
    console.error('Error generating cost analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cost analysis report'
    });
  }
});

module.exports = router;