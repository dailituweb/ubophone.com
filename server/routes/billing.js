const express = require('express');
const router = express.Router();
const { Call, Payment, UserPhoneNumber, User } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Get billing summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    const userId = req.user.userId;
    
    console.log('📊 Billing summary request:', { userId, range });
    
    // Calculate date range
    let startDate = new Date();
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Validate models are available
    if (!Call || !Payment || !User) {
      throw new Error('Required models not available');
    }

    // Get summary data with error handling for each query
    let callCharges = 0;
    let phoneNumberCharges = 0;
    let credits = null;

    try {
      // Call charges (only outbound calls)
      callCharges = await Call.sum('cost', {
        where: {
          userId,
          startTime: { [Op.gte]: startDate },
          direction: 'outbound'
        }
      });
      console.log('📞 Call charges:', callCharges);
    } catch (err) {
      console.error('Error fetching call charges:', err);
    }

    try {
      // Phone number charges
      phoneNumberCharges = await Payment.sum('amount', {
        where: {
          userId,
          createdAt: { [Op.gte]: startDate },
          type: 'phone_purchase',
          status: 'completed'
        }
      });
      console.log('📱 Phone number charges:', phoneNumberCharges);
    } catch (err) {
      console.error('Error fetching phone charges:', err);
    }

    try {
      // Current balance
      credits = await User.findByPk(userId, {
        attributes: ['balance']
      });
      console.log('💰 User credits:', credits?.balance);
    } catch (err) {
      console.error('Error fetching user balance:', err);
    }

    // Calculate total spent
    const safeCallCharges = parseFloat(callCharges || 0);
    const safePhoneCharges = parseFloat(phoneNumberCharges || 0);
    const totalSpent = safeCallCharges + safePhoneCharges;

    res.json({
      totalSpent: totalSpent,
      callCharges: safeCallCharges,
      phoneNumbers: safePhoneCharges,
      credits: parseFloat(credits?.balance || 0)
    });
    
  } catch (error) {
    console.error('Error fetching billing summary:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get billing history
router.get('/history', auth, async (req, res) => {
  try {
    const { filter = 'all', range = 'month', page = 1, limit = 50 } = req.query;
    const userId = req.user.userId;
    const offset = (page - 1) * limit;
    
    console.log('📊 Billing history request:', { userId, filter, range, page, limit });
    
    // Calculate date range
    let startDate = new Date();
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Combine transactions from different tables
    const transactions = [];
    
    // Get call transactions (only outbound calls)
    if (filter === 'all' || filter === 'calls') {
      const calls = await Call.findAll({
        where: {
          userId,
          startTime: { [Op.gte]: startDate },
          direction: 'outbound' // Only show outbound calls
        },
        order: [['startTime', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      console.log(`📞 Found ${calls.length} outbound calls for user ${userId}`);
      
      calls.forEach(call => {
        transactions.push({
          id: `call_${call.id}`,
          date: call.startTime, // Use startTime for calls, not createdAt
          type: 'outgoing_call',
          description: `Call to ${call.toCountry || call.country || 'Unknown'}`,
          details: call.toNumber,
          duration: call.duration,
          amount: -(call.cost || 0),
          balance: 0 // Will be calculated later
        });
      });
    }
    
    // Get payment transactions
    if (filter === 'all' || filter === 'credits' || filter === 'numbers') {
      const paymentWhere = {
        userId,
        createdAt: { [Op.gte]: startDate },
        status: 'completed'
      };
      
      if (filter === 'credits') {
        // 查找充值记录：有type='credit_purchase' 或者 paymentMethod包含stripe/paypal
        paymentWhere[Op.or] = [
          { type: 'credit_purchase' },
          { 
            type: { [Op.is]: null },
            paymentMethod: { [Op.in]: ['stripe', 'stripe_checkout', 'paypal'] }
          }
        ];
      } else if (filter === 'numbers') {
        // 查找电话号码购买记录：有type='phone_purchase' 或者 phoneNumber字段不为空
        paymentWhere[Op.or] = [
          { type: 'phone_purchase' },
          { 
            type: { [Op.is]: null },
            phoneNumber: { [Op.not]: null }
          },
          {
            type: { [Op.is]: null },
            paymentMethod: 'balance'
          }
        ];
      }
      
      const payments = await Payment.findAll({
        where: paymentWhere,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      console.log(`💳 Found ${payments.length} payments for user ${userId} with filter ${filter}`);
      console.log(`💳 Payment query:`, JSON.stringify(paymentWhere, null, 2));
      if (payments.length > 0) {
        console.log(`💳 Sample payment:`, JSON.stringify(payments[0].toJSON(), null, 2));
      }
      
      payments.forEach(payment => {
        // 智能判断交易类型
        let transactionType;
        let amount;
        let description;
        
        if (payment.type === 'credit_purchase' || 
            (!payment.type && ['stripe', 'stripe_checkout', 'paypal'].includes(payment.paymentMethod))) {
          transactionType = 'credit_purchase';
          amount = payment.amount;
          description = payment.description || 'Added credits';
        } else {
          transactionType = 'phone_number';
          amount = -payment.amount;
          description = payment.description || 'Phone number purchase';
        }
        
        transactions.push({
          id: `payment_${payment.id}`,
          date: payment.createdAt,
          type: transactionType,
          description: description,
          details: payment.provider || payment.phoneNumber || payment.transactionId || '',
          amount: amount,
          balance: 0 // Will be calculated later
        });
      });
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate running balance for each transaction
    try {
      const user = await User.findByPk(userId, { attributes: ['balance'] });
      let currentBalance = parseFloat(user?.balance || 0);
      
      // Calculate balance at each transaction time (working backwards from current balance)
      for (let i = 0; i < transactions.length; i++) {
        transactions[i].balance = currentBalance;
        // Subtract the transaction amount to get the balance before this transaction
        currentBalance -= transactions[i].amount;
      }
    } catch (err) {
      console.error('Error calculating running balance:', err);
      // If balance calculation fails, just use current balance for all
      const user = await User.findByPk(userId, { attributes: ['balance'] });
      const fallbackBalance = parseFloat(user?.balance || 0);
      transactions.forEach(t => t.balance = fallbackBalance);
    }
    
    console.log(`📋 Total transactions found: ${transactions.length} for filter: ${filter}`);
    
    res.json({
      success: true,
      transactions: transactions.slice(0, limit),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: transactions.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching billing history:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      filter: req.query.filter,
      range: req.query.range
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export billing data as CSV
router.get('/export', auth, async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    const userId = req.user.userId;
    
    // TODO: Implement CSV export
    res.status(501).json({
      success: false,
      message: 'Export feature coming soon'
    });
    
  } catch (error) {
    console.error('Error exporting billing data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export billing data'
    });
  }
});

module.exports = router;