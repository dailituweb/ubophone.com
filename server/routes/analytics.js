const express = require('express');
const { Call, Payment, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const auth = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Get user analytics dashboard
router.get('/dashboard', auth, cacheMiddleware(180), async (req, res) => {
  try {
    const userId = req.user.userId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Execute all queries in parallel for better performance
    const [totalCalls, totals, recentCalls, callsByDay, topCountries, user] = await Promise.all([
      // Total calls (only outbound calls)
      Call.count({ 
        where: { 
          userId,
          direction: 'outbound' // Only count outbound calls
        } 
      }),
      
      // Total minutes and cost (only outbound calls)
      Call.findAll({
        where: { 
          userId,
          direction: 'outbound' // Only sum outbound calls
        },
        attributes: [
          [fn('SUM', col('duration')), 'totalDuration'],
          [fn('SUM', col('cost')), 'totalCost']
        ],
        raw: true
      }),
      
      // Recent calls (last 30 days, only outbound)
      Call.count({
        where: {
          userId,
          direction: 'outbound', // Only count outbound calls
          startTime: { [Op.gte]: thirtyDaysAgo }
        }
      }),
      
      // Call history by day (last 30 days, only outbound) - optimized single query
      Call.findAll({
        where: {
          userId,
          direction: 'outbound', // Only show outbound calls
          startTime: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: [
          [fn('DATE', col('startTime')), 'date'],
          [fn('COUNT', col('id')), 'calls'],
          [fn('SUM', col('duration')), 'minutes'],
          [fn('SUM', col('cost')), 'cost']
        ],
        group: [fn('DATE', col('startTime'))],
        order: [[fn('DATE', col('startTime')), 'DESC']],
        raw: true
      }),
      
      // Most called countries (only outbound calls)
      Call.findAll({
        where: { 
          userId,
          direction: 'outbound' // Only count outbound calls
        },
        attributes: [
          'country',
          [fn('COUNT', col('id')), 'calls'],
          [fn('SUM', col('duration')), 'minutes'],
          [fn('SUM', col('cost')), 'cost']
        ],
        group: ['country'],
        order: [[literal('calls'), 'DESC']],
        limit: 5,
        raw: true
      }),
      
      // User balance
      User.findByPk(userId, {
        attributes: ['balance']
      })
    ]);

    // Fill in missing days with zero values for consistent chart data
    const callsByDayMap = new Map(callsByDay.map(day => [day.date, day]));
    const filledCallsByDay = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = callsByDayMap.get(dateStr);
      
      filledCallsByDay.push({
        date: dateStr,
        calls: dayData ? parseInt(dayData.calls) : 0,
        minutes: dayData ? Math.ceil(parseFloat(dayData.minutes) / 60) : 0,
        cost: dayData ? parseFloat(dayData.cost) : 0
      });
    }

    res.json({
      summary: {
        totalCalls,
        totalMinutes: Math.ceil((parseFloat(totals[0]?.totalDuration) || 0) / 60),
        recentCalls,
        totalSpent: parseFloat(totals[0]?.totalCost) || 0,
        currentBalance: user ? parseFloat(user.balance) : 0
      },
      callsByDay: filledCallsByDay,
      topCountries
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get call statistics for admin
router.get('/admin/stats', auth, async (req, res) => {
  try {
    // Note: In a real app, you'd check if user is admin
    const totalUsers = await User.count();
    const totalCalls = await Call.count();
    
    const revenueResult = await Call.findAll({
      attributes: [[fn('SUM', col('cost')), 'totalRevenue']],
      raw: true
    });

    const activeUsers = await User.count({
      where: {
        lastLogin: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    });

    res.json({
      totalUsers,
      totalCalls,
      totalRevenue: parseFloat(revenueResult[0]?.totalRevenue) || 0,
      activeUsers
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 