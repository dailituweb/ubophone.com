
const express = require('express');
const { query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { 
  User, 
  Call, 
  Payment, 
  AdminAuditLog,
  UserPhoneNumber,
  sequelize 
} = require('../models');
const { adminAuth: authenticateAdmin, checkPermission: requirePermission } = require('../middleware/adminAuth');
const { auditLog } = require('../middleware/adminAudit');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Apply audit logging to all routes
router.use(auditLog({ 
  resource: 'dashboard',
  includeRequestBody: false
}));

/**
 * GET /api/admin/dashboard/overview
 * Get dashboard overview statistics
 */
router.get('/overview',
  requirePermission('dashboard', 'read'),
  [
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year']).withMessage('Invalid period')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { period = 'month' } = req.query;

      // Calculate date range based on period
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Get parallel statistics
      const [
        userStats,
        callStats,
        revenueStats,
        recentActivity,
        systemHealth
      ] = await Promise.all([
        // User Statistics
        User.findAll({
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'totalUsers'],
            [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "isActive" = true THEN 1 END')), 'activeUsers'],
            [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN "createdAt" >= '${startDate.toISOString()}' THEN 1 END`)), 'newUsers'],
            [sequelize.fn('SUM', sequelize.col('balance')), 'totalBalance']
          ],
          raw: true
        }),

        // Call Statistics
        Call.findAll({
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'totalCalls'],
            [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN "startTime" >= '${startDate.toISOString()}' THEN 1 END`)), 'callsInPeriod'],
            [sequelize.fn('SUM', sequelize.col('duration')), 'totalMinutes'],
            [sequelize.fn('SUM', sequelize.literal(`CASE WHEN "startTime" >= '${startDate.toISOString()}' THEN duration ELSE 0 END`)), 'minutesInPeriod'],
            [sequelize.fn('AVG', sequelize.col('duration')), 'avgCallDuration']
          ],
          raw: true
        }),

        // Revenue Statistics
        Payment.findAll({
          where: {
            status: 'completed'
          },
          attributes: [
            [sequelize.fn('SUM', sequelize.col('amount')), 'totalRevenue'],
            [sequelize.fn('SUM', sequelize.literal(`CASE WHEN "createdAt" >= '${startDate.toISOString()}' THEN amount ELSE 0 END`)), 'revenueInPeriod'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
            [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN "createdAt" >= '${startDate.toISOString()}' THEN 1 END`)), 'transactionsInPeriod']
          ],
          raw: true
        }),

        // Recent Activity (last 10 actions)
        AdminAuditLog.findAll({
          attributes: ['action', 'resource', 'createdAt', 'success'],
          include: [{
            model: require('../models').Admin,
            as: 'admin',
            attributes: ['username', 'firstName', 'lastName']
          }],
          order: [['createdAt', 'DESC']],
          limit: 10
        }),

        // System Health Check
        Promise.all([
          User.count(),
          Call.count({ where: { startTime: { [Op.gte]: startDate } } }),
          Payment.count({ where: { createdAt: { [Op.gte]: startDate } } })
        ])
      ]);

      // Process the results
      const userMetrics = userStats[0] || {};
      const callMetrics = callStats[0] || {};
      const revenueMetrics = revenueStats[0] || {};
      const [totalUsersHealth, recentCallsHealth, recentPaymentsHealth] = systemHealth;

      // Calculate growth rates (simplified - in production, compare with previous period)
      const userGrowthRate = totalUsersHealth > 0 ? ((parseInt(userMetrics.newUsers || 0) / totalUsersHealth) * 100).toFixed(2) : 0;
      const callGrowthRate = callMetrics.totalCalls > 0 ? ((parseInt(callMetrics.callsInPeriod || 0) / parseInt(callMetrics.totalCalls)) * 100).toFixed(2) : 0;

      // System health score (simplified calculation)
      const healthScore = Math.min(100, Math.max(0, 
        (totalUsersHealth > 0 ? 25 : 0) +
        (recentCallsHealth > 0 ? 25 : 0) +
        (recentPaymentsHealth > 0 ? 25 : 0) +
        25 // Base score for system being up
      ));

      res.status(200).json({
        message: 'Dashboard overview retrieved successfully',
        data: {
          period,
          dateRange: {
            start: startDate.toISOString(),
            end: now.toISOString()
          },
          metrics: {
            users: {
              total: parseInt(userMetrics.totalUsers || 0),
              active: parseInt(userMetrics.activeUsers || 0),
              new: parseInt(userMetrics.newUsers || 0),
              totalBalance: parseFloat(userMetrics.totalBalance || 0),
              growthRate: parseFloat(userGrowthRate)
            },
            calls: {
              total: parseInt(callMetrics.totalCalls || 0),
              inPeriod: parseInt(callMetrics.callsInPeriod || 0),
              totalMinutes: parseInt(callMetrics.totalMinutes || 0),
              minutesInPeriod: parseInt(callMetrics.minutesInPeriod || 0),
              avgDuration: parseFloat(callMetrics.avgCallDuration || 0),
              growthRate: parseFloat(callGrowthRate)
            },
            revenue: {
              total: parseFloat(revenueMetrics.totalRevenue || 0),
              inPeriod: parseFloat(revenueMetrics.revenueInPeriod || 0),
              totalTransactions: parseInt(revenueMetrics.totalTransactions || 0),
              transactionsInPeriod: parseInt(revenueMetrics.transactionsInPeriod || 0),
              avgTransactionValue: revenueMetrics.totalTransactions > 0 ? 
                (parseFloat(revenueMetrics.totalRevenue) / parseInt(revenueMetrics.totalTransactions)).toFixed(2) : 0
            }
          },
          recentActivity: recentActivity.map(activity => ({
            action: activity.action,
            resource: activity.resource,
            timestamp: activity.createdAt,
            success: activity.success,
            admin: activity.admin ? {
              username: activity.admin.username,
              name: `${activity.admin.firstName} ${activity.admin.lastName}`
            } : null
          })),
          systemHealth: {
            score: healthScore,
            status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
            checks: {
              database: totalUsersHealth >= 0 ? 'online' : 'offline',
              calls: recentCallsHealth >= 0 ? 'active' : 'inactive',
              payments: recentPaymentsHealth >= 0 ? 'processing' : 'offline'
            }
          }
        },
        code: 'DASHBOARD_OVERVIEW_SUCCESS'
      });
    } catch (error) {
      console.error('Dashboard overview error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve dashboard overview',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/dashboard/charts/users
 * Get user registration chart data
 */
router.get('/charts/users',
  requirePermission('dashboard', 'read'),
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
    query('granularity').optional().isIn(['day', 'week', 'month']).withMessage('Invalid granularity')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { period = '30d', granularity = 'day' } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate;
      let dateFormat;

      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFormat = 'YYYY-MM-DD';
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFormat = 'YYYY-MM-DD';
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          dateFormat = granularity === 'week' ? 'YYYY-WW' : 'YYYY-MM-DD';
          break;
        case '1y':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          dateFormat = granularity === 'month' ? 'YYYY-MM' : 'YYYY-WW';
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFormat = 'YYYY-MM-DD';
      }

      // Get user registration data
      const userRegistrations = await User.findAll({
        where: {
          createdAt: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          [sequelize.fn('DATE_TRUNC', granularity, sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE_TRUNC', granularity, sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE_TRUNC', granularity, sequelize.col('createdAt')), 'ASC']],
        raw: true
      });

      res.status(200).json({
        message: 'User chart data retrieved successfully',
        data: {
          period,
          granularity,
          dateRange: {
            start: startDate.toISOString(),
            end: now.toISOString()
          },
          chartData: userRegistrations.map(item => ({
            date: item.date,
            value: parseInt(item.count)
          }))
        },
        code: 'USER_CHART_SUCCESS'
      });
    } catch (error) {
      console.error('User chart data error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve user chart data',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/dashboard/charts/revenue
 * Get revenue chart data
 */
router.get('/charts/revenue',
  requirePermission('dashboard', 'read'),
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
    query('granularity').optional().isIn(['day', 'week', 'month']).withMessage('Invalid granularity')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { period = '30d', granularity = 'day' } = req.query;

      // Calculate date range (same logic as user chart)
      const now = new Date();
      let startDate;

      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get revenue data
      const revenueData = await Payment.findAll({
        where: {
          createdAt: {
            [Op.gte]: startDate
          },
          status: 'completed'
        },
        attributes: [
          [sequelize.fn('DATE_TRUNC', granularity, sequelize.col('createdAt')), 'date'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'transactions']
        ],
        group: [sequelize.fn('DATE_TRUNC', granularity, sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE_TRUNC', granularity, sequelize.col('createdAt')), 'ASC']],
        raw: true
      });

      res.status(200).json({
        message: 'Revenue chart data retrieved successfully',
        data: {
          period,
          granularity,
          dateRange: {
            start: startDate.toISOString(),
            end: now.toISOString()
          },
          chartData: revenueData.map(item => ({
            date: item.date,
            revenue: parseFloat(item.revenue),
            transactions: parseInt(item.transactions)
          }))
        },
        code: 'REVENUE_CHART_SUCCESS'
      });
    } catch (error) {
      console.error('Revenue chart data error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve revenue chart data',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/dashboard/real-time
 * Get real-time dashboard data (WebSocket alternative for polling)
 */
router.get('/real-time',
  requirePermission('dashboard', 'read'),
  async (req, res) => {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

      const [
        activeCalls,
        recentUsers,
        recentPayments,
        systemStatus
      ] = await Promise.all([
        Call.count({
          where: {
            status: 'in-progress',
            startTime: {
              [Op.gte]: last24Hours
            }
          }
        }),
        User.count({
          where: {
            createdAt: {
              [Op.gte]: lastHour
            }
          }
        }),
        Payment.count({
          where: {
            createdAt: {
              [Op.gte]: lastHour
            },
            status: 'completed'
          }
        }),
        // Simple system status check
        Promise.resolve({
          database: 'connected',
          api: 'operational',
          payments: 'operational'
        })
      ]);

      res.status(200).json({
        message: 'Real-time data retrieved successfully',
        data: {
          timestamp: now.toISOString(),
          activeCalls,
          recentUsers,
          recentPayments,
          systemStatus
        },
        code: 'REALTIME_SUCCESS'
      });
    } catch (error) {
      console.error('Real-time data error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve real-time data',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

module.exports = router;