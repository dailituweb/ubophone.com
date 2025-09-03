const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key');
const { SubscriptionPlan, UserSubscription, User, CouponUsage } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取所有可用的订阅计划
router.get('/plans', async (req, res) => {
  try {
    // Demo data since we're in development mode
    const demoPlans = [
      {
        id: '1',
        name: 'Basic',
        description: 'Perfect for light usage',
        price: 9.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: {
          monthlyCredits: 25,
          callRateDiscount: 0,
          freeMinutes: 100,
          prioritySupport: false,
          recordingStorage: 30,
          qualityAnalytics: false,
          apiAccess: false
        },
        trialDays: 7,
        isActive: true,
        displayOrder: 1
      },
      {
        id: '2',
        name: 'Premium',
        description: 'Best value for regular users',
        price: 19.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: {
          monthlyCredits: 75,
          callRateDiscount: 15,
          freeMinutes: 500,
          prioritySupport: true,
          recordingStorage: 90,
          qualityAnalytics: true,
          apiAccess: false
        },
        trialDays: 14,
        isActive: true,
        displayOrder: 2,
        popular: true
      },
      {
        id: '3',
        name: 'Enterprise',
        description: 'For businesses and power users',
        price: 49.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: {
          monthlyCredits: 200,
          callRateDiscount: 25,
          freeMinutes: 2000,
          prioritySupport: true,
          recordingStorage: 365,
          qualityAnalytics: true,
          apiAccess: true
        },
        trialDays: 30,
        isActive: true,
        displayOrder: 3
      }
    ];

    res.json({
      success: true,
      plans: demoPlans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans'
    });
  }
});

// 获取用户当前订阅状态
router.get('/current', auth, async (req, res) => {
  try {
    // For demo purposes, return null (no active subscription)
    res.json({
      success: true,
      subscription: null,
      usage: null,
      message: 'No active subscription found'
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription'
    });
  }
});

// 创建新订阅
router.post('/create', auth, async (req, res) => {
  try {
    const { planId, couponCode } = req.body;

    // Find the plan (using demo data)
    const plans = [
      {
        id: '1',
        name: 'Basic',
        price: 9.99,
        trialDays: 7
      },
      {
        id: '2', 
        name: 'Premium',
        price: 19.99,
        trialDays: 14
      },
      {
        id: '3',
        name: 'Enterprise', 
        price: 49.99,
        trialDays: 30
      }
    ];

    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Simulate subscription creation
    const mockSubscription = {
      id: `sub_${Date.now()}`,
      userId: req.user.userId,
      planId: planId,
      status: plan.trialDays > 0 ? 'trialing' : 'active',
      startDate: new Date(),
      trialEndDate: plan.trialDays > 0 ? 
        new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) : null,
      plan: plan
    };

    res.json({
      success: true,
      subscription: mockSubscription,
      message: `Subscription to ${plan.name} plan created successfully!`
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
});

// 取消订阅
router.post('/cancel', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Subscription canceled successfully'
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// 获取订阅历史
router.get('/history', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      subscriptions: []
    });
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription history'
    });
  }
});

module.exports = router; 