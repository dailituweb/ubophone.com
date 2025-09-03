const express = require('express');
const { Coupon, CouponUsage, User, Payment, UserSubscription } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// 验证优惠券
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, context = 'credits', amount = 0 } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    // Demo coupons data
    const demoCoupons = [
      {
        id: '1',
        code: 'WELCOME25',
        name: 'Welcome Bonus',
        description: 'Get 25% off your first subscription',
        type: 'percentage',
        value: 25,
        isActive: true,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        maxUses: null,
        usedCount: 0,
        maxUsesPerUser: 1,
        applicableToProducts: ['subscription'],
        minimumAmount: 10
      },
      {
        id: '2',
        code: 'SAVE10',
        name: 'Save $10',
        description: 'Fixed $10 discount on any purchase',
        type: 'fixed_amount',
        value: 10,
        isActive: true,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        maxUses: 100,
        usedCount: 5,
        maxUsesPerUser: 1,
        applicableToProducts: [],
        minimumAmount: 25
      },
      {
        id: '3',
        code: 'FREECREDITS',
        name: 'Free Credits',
        description: 'Get $5 in free call credits',
        type: 'free_credits',
        value: 5,
        isActive: true,
        validFrom: new Date('2024-01-01'),
        validUntil: null,
        maxUses: null,
        usedCount: 0,
        maxUsesPerUser: 1,
        applicableToProducts: ['credits'],
        minimumAmount: 0
      }
    ];

    const coupon = demoCoupons.find(c => c.code === code.toUpperCase());

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Basic validation
    const now = new Date();
    if (now < coupon.validFrom) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is not yet valid'
      });
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Coupon has expired'
      });
    }

    if (amount > 0 && amount < coupon.minimumAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for this coupon is $${coupon.minimumAmount}`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (amount > 0) {
      switch (coupon.type) {
        case 'percentage':
          discountAmount = (amount * parseFloat(coupon.value)) / 100;
          break;
        case 'fixed_amount':
          discountAmount = Math.min(parseFloat(coupon.value), amount);
          break;
        case 'free_credits':
          discountAmount = parseFloat(coupon.value);
          break;
      }
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    res.json({
      success: true,
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value
      },
      discount: {
        amount: discountAmount,
        originalAmount: amount,
        finalAmount: finalAmount,
        savings: discountAmount,
        percentage: amount > 0 ? Math.round((discountAmount / amount) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate coupon'
    });
  }
});

// 应用优惠券
router.post('/apply', auth, async (req, res) => {
  try {
    const { code, context, amount = 0 } = req.body;

    // For free credits coupons, simulate adding credits to user account
    if (code.toUpperCase() === 'FREECREDITS') {
      return res.json({
        success: true,
        message: '$5 credits added to your account',
        newBalance: 25.00 // Simulated new balance
      });
    }

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      discount: {
        amount: amount * 0.25, // 25% discount simulation
        originalAmount: amount,
        finalAmount: amount * 0.75
      }
    });

  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply coupon'
    });
  }
});

// 获取公开的促销优惠券
router.get('/promotions', async (req, res) => {
  try {
    const promotionalCoupons = [
      {
        id: '1',
        code: 'WELCOME25',
        name: 'Welcome Bonus',
        description: 'Get 25% off your first subscription',
        type: 'percentage',
        value: 25,
        validUntil: new Date('2024-12-31'),
        minimumAmount: 10
      },
      {
        id: '2',
        code: 'SAVE10',
        name: 'Save $10',
        description: 'Fixed $10 discount on any purchase',
        type: 'fixed_amount',
        value: 10,
        validUntil: new Date('2024-12-31'),
        minimumAmount: 25
      },
      {
        id: '3',
        code: 'FREECREDITS',
        name: 'Free Credits',
        description: 'Get $5 in free call credits',
        type: 'free_credits',
        value: 5,
        validUntil: null,
        minimumAmount: 0
      },
      {
        id: '4',
        code: 'SPRING20',
        name: 'Spring Special',
        description: '20% off all subscription plans',
        type: 'percentage',
        value: 20,
        validUntil: new Date('2024-06-21'),
        minimumAmount: 15
      }
    ];

    res.json({
      success: true,
      coupons: promotionalCoupons
    });

  } catch (error) {
    console.error('Error fetching promotional coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promotional coupons'
    });
  }
});

// 获取用户优惠券使用历史
router.get('/usage-history', auth, async (req, res) => {
  try {
    // Demo usage history
    const demoHistory = [
      {
        id: '1',
        coupon: {
          code: 'WELCOME25',
          name: 'Welcome Bonus',
          type: 'percentage'
        },
        discountAmount: 5.00,
        originalAmount: 20.00,
        finalAmount: 15.00,
        context: 'subscription',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        coupon: {
          code: 'FREECREDITS',
          name: 'Free Credits',
          type: 'free_credits'
        },
        discountAmount: 5.00,
        originalAmount: 0.00,
        finalAmount: 0.00,
        context: 'credits',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    ];

    res.json({
      success: true,
      usages: demoHistory,
      pagination: {
        page: 1,
        limit: 10,
        total: demoHistory.length,
        pages: 1
      }
    });

  } catch (error) {
    console.error('Error fetching coupon usage history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage history'
    });
  }
});

// 检查用户可用的自动优惠券
router.get('/auto-apply', auth, async (req, res) => {
  try {
    const { context = 'credits', amount = 0 } = req.query;

    const user = await User.findByPk(req.user.userId);
    const now = new Date();

    // 查找可自动应用的优惠券
    const coupons = await Coupon.findAll({
      where: {
        isActive: true,
        autoApply: true,
        validFrom: { [Op.lte]: now },
        [Op.or]: [
          { validUntil: null },
          { validUntil: { [Op.gt]: now } }
        ],
        [Op.or]: [
          { maxUses: null },
          { usedCount: { [Op.lt]: { [Op.col]: 'maxUses' } } }
        ]
      }
    });

    // 优化：批量获取用户使用情况，避免N+1查询
    const couponIds = coupons.map(c => c.id);
    const userUsages = await CouponUsage.findAll({
      where: {
        couponId: { [Op.in]: couponIds },
        userId: req.user.userId
      },
      attributes: ['couponId', [sequelize.fn('COUNT', sequelize.col('id')), 'usageCount']],
      group: ['couponId'],
      raw: true
    });

    // 创建优惠券ID到使用次数的映射
    const usageMap = userUsages.reduce((acc, usage) => {
      acc[usage.couponId] = parseInt(usage.usageCount) || 0;
      return acc;
    }, {});

    const applicableCoupons = [];

    for (const coupon of coupons) {
      // 检查用户是否已使用（使用预加载的数据）
      const userUsageCount = usageMap[coupon.id] || 0;

      if (userUsageCount >= coupon.maxUsesPerUser) {
        continue;
      }

      // 检查适用产品
      if (coupon.applicableToProducts.length > 0 && !coupon.applicableToProducts.includes(context)) {
        continue;
      }

      // 检查最小金额
      if (amount > 0 && amount < coupon.minimumAmount) {
        continue;
      }

      // 检查用户细分
      if (coupon.userSegments.length > 0) {
        // 这里可以添加更复杂的用户细分逻辑
        // 比如新用户、老用户、高价值用户等
        const userSegment = getUserSegment(user);
        if (!coupon.userSegments.includes(userSegment)) {
          continue;
        }
      }

      applicableCoupons.push(coupon);
    }

    // 选择最优优惠券（最大折扣）
    let bestCoupon = null;
    let maxDiscount = 0;

    for (const coupon of applicableCoupons) {
      let discount = 0;
      switch (coupon.type) {
        case 'percentage':
          discount = (amount * parseFloat(coupon.value)) / 100;
          break;
        case 'fixed_amount':
          discount = Math.min(parseFloat(coupon.value), amount);
          break;
        case 'free_credits':
          discount = parseFloat(coupon.value);
          break;
      }

      if (discount > maxDiscount) {
        maxDiscount = discount;
        bestCoupon = coupon;
      }
    }

    if (bestCoupon) {
      res.json({
        success: true,
        coupon: {
          id: bestCoupon.id,
          code: bestCoupon.code,
          name: bestCoupon.name,
          description: bestCoupon.description,
          type: bestCoupon.type,
          value: bestCoupon.value
        },
        discount: maxDiscount,
        autoApplicable: true
      });
    } else {
      res.json({
        success: true,
        coupon: null,
        autoApplicable: false
      });
    }

  } catch (error) {
    console.error('Error checking auto-apply coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check auto-apply coupons'
    });
  }
});

// 管理员功能：创建优惠券
router.post('/admin/create', auth, async (req, res) => {
  try {
    // 这里应该添加管理员权限验证
    // if (!req.user.isAdmin) { return res.status(403).json(...) }

    const {
      code,
      name,
      description,
      type,
      value,
      maxUses,
      maxUsesPerUser = 1,
      validFrom,
      validUntil,
      applicableToPlans = [],
      applicableToProducts = [],
      minimumAmount = 0,
      isPublic = false,
      stackable = false,
      autoApply = false,
      userSegments = []
    } = req.body;

    // 验证优惠券代码唯一性
    const existingCoupon = await Coupon.findOne({
      where: { code: code.toUpperCase() }
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      maxUses,
      maxUsesPerUser,
      validFrom: validFrom || new Date(),
      validUntil,
      applicableToPlans,
      applicableToProducts,
      minimumAmount,
      isPublic,
      stackable,
      autoApply,
      userSegments
    });

    res.json({
      success: true,
      coupon: coupon,
      message: 'Coupon created successfully'
    });

  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create coupon'
    });
  }
});

// 管理员功能：获取优惠券统计
router.get('/admin/stats', auth, async (req, res) => {
  try {
    // 添加管理员权限验证
    
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const stats = await CouponUsage.findAll({
      where: dateFilter,
      attributes: [
        [Op.fn('COUNT', Op.col('id')), 'totalUsages'],
        [Op.fn('SUM', Op.col('discountAmount')), 'totalDiscount'],
        [Op.fn('SUM', Op.col('originalAmount')), 'totalOriginalAmount'],
        [Op.fn('AVG', Op.col('discountAmount')), 'averageDiscount']
      ],
      raw: true
    });

    const topCoupons = await CouponUsage.findAll({
      where: dateFilter,
      attributes: [
        'couponId',
        [Op.fn('COUNT', Op.col('CouponUsage.id')), 'usageCount'],
        [Op.fn('SUM', Op.col('discountAmount')), 'totalDiscount']
      ],
      include: [{
        model: Coupon,
        as: 'coupon',
        attributes: ['code', 'name', 'type']
      }],
      group: ['couponId', 'coupon.id'],
      order: [[Op.fn('COUNT', Op.col('CouponUsage.id')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      stats: stats[0],
      topCoupons: topCoupons
    });

  } catch (error) {
    console.error('Error fetching coupon stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon stats'
    });
  }
});

// 内部验证函数
async function validateCouponInternal(code, userId, context, amount) {
  const coupon = await Coupon.findOne({
    where: { 
      code: code.toUpperCase(),
      isActive: true
    }
  });

  if (!coupon) {
    return { valid: false, message: 'Invalid coupon code' };
  }

  const now = new Date();
  if (now < coupon.validFrom) {
    return { valid: false, message: 'Coupon is not yet valid' };
  }

  if (coupon.validUntil && now > coupon.validUntil) {
    return { valid: false, message: 'Coupon has expired' };
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }

  const userUsageCount = await CouponUsage.count({
    where: {
      couponId: coupon.id,
      userId: userId
    }
  });

  if (userUsageCount >= coupon.maxUsesPerUser) {
    return { valid: false, message: 'You have already used this coupon' };
  }

  if (coupon.applicableToProducts.length > 0 && !coupon.applicableToProducts.includes(context)) {
    return { valid: false, message: `This coupon is not applicable to ${context}` };
  }

  if (amount > 0 && amount < coupon.minimumAmount) {
    return { valid: false, message: `Minimum order amount for this coupon is $${coupon.minimumAmount}` };
  }

  let discountAmount = 0;
  if (amount > 0) {
    switch (coupon.type) {
      case 'percentage':
        discountAmount = (amount * parseFloat(coupon.value)) / 100;
        break;
      case 'fixed_amount':
        discountAmount = Math.min(parseFloat(coupon.value), amount);
        break;
      case 'free_credits':
        discountAmount = parseFloat(coupon.value);
        break;
    }
  }

  const finalAmount = Math.max(0, amount - discountAmount);

  return {
    valid: true,
    coupon,
    discountAmount,
    finalAmount
  };
}

// 获取用户细分（简单示例）
function getUserSegment(user) {
  const now = new Date();
  const daysSinceRegistration = Math.floor((now - user.createdAt) / (1000 * 60 * 60 * 24));
  
  if (daysSinceRegistration <= 7) {
    return 'new_user';
  } else if (daysSinceRegistration > 90) {
    return 'loyal_user';
  } else if (user.balance > 100) {
    return 'high_value_user';
  } else {
    return 'regular_user';
  }
}

module.exports = router; 