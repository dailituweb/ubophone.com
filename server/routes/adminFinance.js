
const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Payment, User, Call, Invoice } = require('../models');
const { adminAuth: authenticateAdmin, checkPermission: requirePermission } = require('../middleware/adminAuth');
const { auditLog } = require('../middleware/adminAudit');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Apply audit logging to all routes
router.use(auditLog({ 
  resource: 'finance',
  includeRequestBody: true
}));

/**
 * GET /api/admin/finance/overview
 * Get financial overview and statistics
 */
router.get('/overview',
  requirePermission('finance', 'read'),
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
      let dateFilter = {};
      const now = new Date();
      
      switch (period) {
        case 'today':
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateFilter = { [Op.gte]: startOfToday };
          break;
        case 'week':
          const startOfWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);
          dateFilter = { [Op.gte]: startOfWeek };
          break;
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = { [Op.gte]: startOfMonth };
          break;
        case 'quarter':
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
          const startOfQuarter = new Date(now.getFullYear(), quarterMonth, 1);
          dateFilter = { [Op.gte]: startOfQuarter };
          break;
        case 'year':
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          dateFilter = { [Op.gte]: startOfYear };
          break;
      }

      const [revenueStats, paymentStats, callStats, userBalanceStats] = await Promise.all([
        // Revenue from completed payments
        Payment.findOne({
          where: { 
            status: 'completed',
            createdAt: dateFilter
          },
          attributes: [
            [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalRevenue'],
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalPayments'],
            [require('sequelize').fn('AVG', require('sequelize').col('amount')), 'avgPaymentAmount']
          ],
          raw: true
        }),
        // Payment method distribution
        Payment.findAll({
          where: { 
            status: 'completed',
            createdAt: dateFilter
          },
          attributes: [
            'paymentMethod',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
            [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'amount']
          ],
          group: ['paymentMethod'],
          raw: true
        }),
        // Call revenue
        Call.findOne({
          where: { 
            status: 'completed',
            createdAt: dateFilter
          },
          attributes: [
            [require('sequelize').fn('SUM', require('sequelize').col('cost')), 'callRevenue'],
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalCalls'],
            [require('sequelize').fn('SUM', require('sequelize').col('duration')), 'totalMinutes']
          ],
          raw: true
        }),
        // User balance statistics
        User.findOne({
          attributes: [
            [require('sequelize').fn('SUM', require('sequelize').col('balance')), 'totalUserBalance'],
            [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN balance > 0 THEN 1 END')), 'usersWithBalance'],
            [require('sequelize').fn('AVG', require('sequelize').col('balance')), 'avgUserBalance']
          ],
          raw: true
        })
      ]);

      // Get daily revenue trend for the period
      const dailyRevenue = await Payment.findAll({
        where: { 
          status: 'completed',
          createdAt: dateFilter
        },
        attributes: [
          [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
          [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'revenue'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'transactions']
        ],
        group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
        order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
        raw: true
      });

      res.status(200).json({
        message: 'Financial overview retrieved successfully',
        data: {
          overview: {
            totalRevenue: parseFloat(revenueStats?.totalRevenue || 0),
            totalPayments: parseInt(revenueStats?.totalPayments || 0),
            avgPaymentAmount: parseFloat(revenueStats?.avgPaymentAmount || 0),
            callRevenue: parseFloat(callStats?.callRevenue || 0),
            totalCalls: parseInt(callStats?.totalCalls || 0),
            totalCallMinutes: parseInt(callStats?.totalMinutes || 0),
            totalUserBalance: parseFloat(userBalanceStats?.totalUserBalance || 0),
            usersWithBalance: parseInt(userBalanceStats?.usersWithBalance || 0),
            avgUserBalance: parseFloat(userBalanceStats?.avgUserBalance || 0)
          },
          paymentMethodDistribution: paymentStats,
          dailyRevenue,
          period
        },
        code: 'FINANCIAL_OVERVIEW_RETRIEVED'
      });
    } catch (error) {
      console.error('Get financial overview error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve financial overview',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/finance/payments
 * Get paginated list of payments with optional filtering
 */
router.get('/payments',
  requirePermission('finance', 'read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ max: 255 }).withMessage('Search term too long'),
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'refunded']).withMessage('Invalid status'),
    query('paymentMethod').optional().isIn(['stripe', 'paypal', 'admin_adjustment', 'credit_card', 'bank_transfer']).withMessage('Invalid payment method'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
    query('minAmount').optional().isFloat({ min: 0 }).withMessage('Invalid minimum amount'),
    query('maxAmount').optional().isFloat({ min: 0 }).withMessage('Invalid maximum amount'),
    query('sortBy').optional().isIn(['createdAt', 'amount', 'status']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Invalid sort order')
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

      const {
        page = 1,
        limit = 20,
        search = '',
        status,
        paymentMethod,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }

      if (paymentMethod) {
        whereClause.paymentMethod = paymentMethod;
      }

      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) {
          whereClause.createdAt[Op.gte] = new Date(dateFrom);
        }
        if (dateTo) {
          whereClause.createdAt[Op.lte] = new Date(dateTo);
        }
      }

      if (minAmount !== undefined || maxAmount !== undefined) {
        whereClause.amount = {};
        if (minAmount !== undefined) {
          whereClause.amount[Op.gte] = parseFloat(minAmount);
        }
        if (maxAmount !== undefined) {
          whereClause.amount[Op.lte] = parseFloat(maxAmount);
        }
      }

      if (search) {
        whereClause[Op.or] = [
          { transactionId: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { '$user.email$': { [Op.iLike]: `%${search}%` } },
          { '$user.username$': { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get payments with pagination
      const { rows: payments, count: totalPayments } = await Payment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
            required: false
          }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      const totalPages = Math.ceil(totalPayments / parseInt(limit));
      
      res.status(200).json({
        message: 'Payments retrieved successfully',
        data: {
          payments,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: totalPayments,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPreviousPage: parseInt(page) > 1
          }
        },
        code: 'PAYMENTS_RETRIEVED'
      });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve payments',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/finance/payments/:id
 * Get detailed payment information
 */
router.get('/payments/:id',
  requirePermission('finance', 'read'),
  [
    param('id').isUUID().withMessage('Invalid payment ID format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid payment ID',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { id } = req.params;

      const payment = await Payment.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: { exclude: ['password'] }
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND'
        });
      }

      res.status(200).json({
        message: 'Payment details retrieved successfully',
        data: { payment },
        code: 'PAYMENT_DETAILS_RETRIEVED'
      });
    } catch (error) {
      console.error('Get payment details error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve payment details',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * POST /api/admin/finance/payments/:id/refund
 * Process a refund for a payment
 */
router.post('/payments/:id/refund',
  requirePermission('finance', 'write'),
  [
    param('id').isUUID().withMessage('Invalid payment ID format'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be non-negative'),
    body('reason').notEmpty().isLength({ max: 255 }).withMessage('Refund reason is required and must be under 255 characters'),
    body('type').isIn(['full', 'partial']).withMessage('Type must be full or partial')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { id } = req.params;
      const { amount, reason, type } = req.body;

      const payment = await Payment.findByPk(id, {
        include: [{ model: User, as: 'user' }]
      });

      if (!payment) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND'
        });
      }

      if (payment.status !== 'completed') {
        return res.status(400).json({
          error: 'Invalid Operation',
          message: 'Only completed payments can be refunded',
          code: 'PAYMENT_NOT_COMPLETED'
        });
      }

      const refundAmount = type === 'full' ? payment.amount : parseFloat(amount);

      if (type === 'partial' && (!amount || refundAmount <= 0 || refundAmount > payment.amount)) {
        return res.status(400).json({
          error: 'Invalid Operation',
          message: 'Invalid refund amount for partial refund',
          code: 'INVALID_REFUND_AMOUNT'
        });
      }

      // Create refund record and update user balance
      await require('sequelize').transaction(async (t) => {
        // Create refund payment record
        const refundPayment = await Payment.create({
          userId: payment.userId,
          amount: refundAmount,
          currency: payment.currency,
          status: 'completed',
          paymentMethod: 'admin_refund',
          type: 'refund',
          description: `Refund for payment ${payment.id}: ${reason}`,
          transactionId: `refund_${payment.id}_${Date.now()}`,
          metadata: {
            originalPaymentId: payment.id,
            refundedBy: req.admin.id,
            refundedByUsername: req.admin.username,
            refundReason: reason,
            refundType: type,
            refundedAt: new Date().toISOString()
          }
        }, { transaction: t });

        // Update user balance
        if (payment.user) {
          await payment.user.update({
            balance: payment.user.balance + refundAmount
          }, { transaction: t });
        }

        // Update original payment status if full refund
        if (type === 'full') {
          await payment.update({
            status: 'refunded',
            metadata: {
              ...payment.metadata,
              refundedBy: req.admin.id,
              refundedAt: new Date().toISOString(),
              refundReason: reason
            }
          }, { transaction: t });
        }
      });

      res.status(200).json({
        message: 'Refund processed successfully',
        data: {
          paymentId: id,
          refundAmount,
          refundType: type,
          reason,
          processedBy: req.admin.username,
          processedAt: new Date().toISOString()
        },
        code: 'REFUND_PROCESSED'
      });
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process refund',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/finance/invoices
 * Get paginated list of invoices
 */
router.get('/invoices',
  requirePermission('finance', 'read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ max: 255 }).withMessage('Search term too long'),
    query('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format')
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

      const {
        page = 1,
        limit = 20,
        search = '',
        status,
        dateFrom,
        dateTo
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }

      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) {
          whereClause.createdAt[Op.gte] = new Date(dateFrom);
        }
        if (dateTo) {
          whereClause.createdAt[Op.lte] = new Date(dateTo);
        }
      }

      if (search) {
        whereClause[Op.or] = [
          { invoiceNumber: { [Op.iLike]: `%${search}%` } },
          { '$user.email$': { [Op.iLike]: `%${search}%` } },
          { '$user.username$': { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get invoices with pagination
      const { rows: invoices, count: totalInvoices } = await Invoice.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      const totalPages = Math.ceil(totalInvoices / parseInt(limit));
      
      res.status(200).json({
        message: 'Invoices retrieved successfully',
        data: {
          invoices,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: totalInvoices,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPreviousPage: parseInt(page) > 1
          }
        },
        code: 'INVOICES_RETRIEVED'
      });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve invoices',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/finance/reports/revenue
 * Get revenue analysis report
 */
router.get('/reports/revenue',
  requirePermission('finance', 'read'),
  [
    query('period').optional().isIn(['day', 'week', 'month', 'quarter', 'year']).withMessage('Invalid period'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy parameter')
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

      const { 
        period = 'month', 
        startDate, 
        endDate, 
        groupBy = 'day' 
      } = req.query;

      let dateFilter = {};
      const now = new Date();
      
      if (startDate && endDate) {
        dateFilter = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      } else {
        switch (period) {
          case 'day':
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = { [Op.gte]: startOfDay };
            break;
          case 'week':
            const startOfWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);
            dateFilter = { [Op.gte]: startOfWeek };
            break;
          case 'month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { [Op.gte]: startOfMonth };
            break;
          case 'quarter':
            const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
            const startOfQuarter = new Date(now.getFullYear(), quarterMonth, 1);
            dateFilter = { [Op.gte]: startOfQuarter };
            break;
          case 'year':
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            dateFilter = { [Op.gte]: startOfYear };
            break;
        }
      }

      // Get revenue data grouped by specified period
      let dateFormat;
      switch (groupBy) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
      }

      const [revenueByPeriod, paymentMethodBreakdown, topUsers] = await Promise.all([
        Payment.findAll({
          where: { 
            status: 'completed',
            createdAt: dateFilter
          },
          attributes: [
            [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('createdAt'), dateFormat), 'period'],
            [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'revenue'],
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'transactions']
          ],
          group: [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('createdAt'), dateFormat)],
          order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('createdAt'), dateFormat), 'ASC']],
          raw: true
        }),
        Payment.findAll({
          where: { 
            status: 'completed',
            createdAt: dateFilter
          },
          attributes: [
            'paymentMethod',
            [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'revenue'],
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'transactions']
          ],
          group: ['paymentMethod'],
          raw: true
        }),
        Payment.findAll({
          where: { 
            status: 'completed',
            createdAt: dateFilter
          },
          attributes: [
            'userId',
            [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalSpent'],
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'transactions']
          ],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['username', 'email', 'firstName', 'lastName']
            }
          ],
          group: ['userId', 'user.id'],
          order: [[require('sequelize').fn('SUM', require('sequelize').col('amount')), 'DESC']],
          limit: 10
        })
      ]);

      res.status(200).json({
        message: 'Revenue report generated successfully',
        data: {
          revenueByPeriod,
          paymentMethodBreakdown,
          topUsers,
          parameters: {
            period,
            groupBy,
            startDate: startDate || dateFilter[Op.gte],
            endDate: endDate || now
          }
        },
        code: 'REVENUE_REPORT_GENERATED'
      });
    } catch (error) {
      console.error('Generate revenue report error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate revenue report',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

module.exports = router;