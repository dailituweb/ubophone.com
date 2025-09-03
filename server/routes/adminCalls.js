
const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Call, User, IncomingCall } = require('../models');
const { adminAuth: authenticateAdmin, checkPermission: requirePermission } = require('../middleware/adminAuth');
const { auditLog } = require('../middleware/adminAudit');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Apply audit logging to all routes
router.use(auditLog({ 
  resource: 'calls',
  includeRequestBody: true
}));

/**
 * GET /api/admin/calls
 * Get paginated list of calls with optional filtering
 */
router.get('/', 
  requirePermission('calls', 'read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ max: 255 }).withMessage('Search term too long'),
    query('status').optional().isIn(['pending', 'ringing', 'in-progress', 'completed', 'failed', 'missed', 'canceled']).withMessage('Invalid status'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
    query('minDuration').optional().isInt({ min: 0 }).withMessage('Invalid minimum duration'),
    query('maxDuration').optional().isInt({ min: 0 }).withMessage('Invalid maximum duration'),
    query('sortBy').optional().isIn(['createdAt', 'duration', 'cost', 'status']).withMessage('Invalid sort field'),
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
        dateFrom,
        dateTo,
        minDuration,
        maxDuration,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
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

      if (minDuration !== undefined || maxDuration !== undefined) {
        whereClause.duration = {};
        if (minDuration !== undefined) {
          whereClause.duration[Op.gte] = parseInt(minDuration);
        }
        if (maxDuration !== undefined) {
          whereClause.duration[Op.lte] = parseInt(maxDuration);
        }
      }

      if (search) {
        whereClause[Op.or] = [
          { fromNumber: { [Op.iLike]: `%${search}%` } },
          { toNumber: { [Op.iLike]: `%${search}%` } },
          { callSid: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get calls with pagination
      const { rows: calls, count: totalCalls } = await Call.findAndCountAll({
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

      const totalPages = Math.ceil(totalCalls / parseInt(limit));
      
      res.status(200).json({
        message: 'Calls retrieved successfully',
        data: {
          calls,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: totalCalls,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPreviousPage: parseInt(page) > 1
          }
        },
        code: 'CALLS_RETRIEVED'
      });
    } catch (error) {
      console.error('Get calls error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve calls',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/calls/live
 * Get currently active/live calls
 */
router.get('/live',
  requirePermission('calls', 'read'),
  async (req, res) => {
    try {
      const liveCalls = await Call.findAll({
        where: {
          status: {
            [Op.in]: ['ringing', 'in-progress']
          }
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        message: 'Live calls retrieved successfully',
        data: {
          calls: liveCalls,
          count: liveCalls.length
        },
        code: 'LIVE_CALLS_RETRIEVED'
      });
    } catch (error) {
      console.error('Get live calls error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve live calls',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/calls/:id
 * Get detailed call information
 */
router.get('/:id',
  requirePermission('calls', 'read'),
  [
    param('id').isUUID().withMessage('Invalid call ID format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid call ID',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { id } = req.params;

      const call = await Call.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: { exclude: ['password'] }
          }
        ]
      });

      if (!call) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Call not found',
          code: 'CALL_NOT_FOUND'
        });
      }

      res.status(200).json({
        message: 'Call details retrieved successfully',
        data: { call },
        code: 'CALL_DETAILS_RETRIEVED'
      });
    } catch (error) {
      console.error('Get call details error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve call details',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/calls/stats/overview
 * Get call statistics overview
 */
router.get('/stats/overview',
  requirePermission('calls', 'read'),
  async (req, res) => {
    try {
      const { period = '24h' } = req.query;
      
      let dateFilter = {};
      const now = new Date();
      
      switch (period) {
        case '1h':
          dateFilter = { [Op.gte]: new Date(now - 60 * 60 * 1000) };
          break;
        case '24h':
          dateFilter = { [Op.gte]: new Date(now - 24 * 60 * 60 * 1000) };
          break;
        case '7d':
          dateFilter = { [Op.gte]: new Date(now - 7 * 24 * 60 * 60 * 1000) };
          break;
        case '30d':
          dateFilter = { [Op.gte]: new Date(now - 30 * 24 * 60 * 60 * 1000) };
          break;
        default:
          dateFilter = { [Op.gte]: new Date(now - 24 * 60 * 60 * 1000) };
      }

      const [callStats, recentCalls, statusDistribution] = await Promise.all([
        Call.findOne({
          where: { createdAt: dateFilter },
          attributes: [
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalCalls'],
            [require('sequelize').fn('SUM', require('sequelize').col('duration')), 'totalDuration'],
            [require('sequelize').fn('SUM', require('sequelize').col('cost')), 'totalRevenue'],
            [require('sequelize').fn('AVG', require('sequelize').col('duration')), 'avgDuration'],
            [require('sequelize').fn('AVG', require('sequelize').col('cost')), 'avgCost']
          ],
          raw: true
        }),
        Call.findAll({
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['username', 'email']
            }
          ]
        }),
        Call.findAll({
          where: { createdAt: dateFilter },
          attributes: [
            'status',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
          ],
          group: ['status'],
          raw: true
        })
      ]);

      // Get live call count
      const liveCalls = await Call.count({
        where: {
          status: { [Op.in]: ['ringing', 'in-progress'] }
        }
      });

      res.status(200).json({
        message: 'Call statistics retrieved successfully',
        data: {
          overview: {
            totalCalls: parseInt(callStats?.totalCalls || 0),
            totalDuration: parseInt(callStats?.totalDuration || 0),
            totalRevenue: parseFloat(callStats?.totalRevenue || 0),
            avgDuration: parseFloat(callStats?.avgDuration || 0),
            avgCost: parseFloat(callStats?.avgCost || 0),
            liveCalls
          },
          statusDistribution,
          recentCalls
        },
        code: 'CALL_STATS_RETRIEVED'
      });
    } catch (error) {
      console.error('Get call stats error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve call statistics',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * POST /api/admin/calls/:id/terminate
 * Terminate an active call
 */
router.post('/:id/terminate',
  requirePermission('calls', 'write'),
  [
    param('id').isUUID().withMessage('Invalid call ID format'),
    body('reason').optional().isLength({ max: 255 }).withMessage('Reason must be under 255 characters')
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
      const { reason } = req.body;

      const call = await Call.findByPk(id);
      if (!call) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Call not found',
          code: 'CALL_NOT_FOUND'
        });
      }

      if (!['ringing', 'in-progress'].includes(call.status)) {
        return res.status(400).json({
          error: 'Invalid Operation',
          message: 'Call is not active and cannot be terminated',
          code: 'CALL_NOT_ACTIVE'
        });
      }

      // Update call status
      await call.update({
        status: 'terminated',
        endTime: new Date(),
        metadata: {
          ...call.metadata,
          terminatedBy: {
            adminId: req.admin.id,
            adminUsername: req.admin.username,
            reason: reason || 'Terminated by admin',
            timestamp: new Date().toISOString()
          }
        }
      });

      // Here you would also integrate with Twilio to actually terminate the call
      // Example: await twilioClient.calls(call.callSid).update({ status: 'completed' });

      res.status(200).json({
        message: 'Call terminated successfully',
        data: {
          callId: id,
          status: 'terminated',
          terminatedBy: req.admin.username,
          reason: reason || 'Terminated by admin'
        },
        code: 'CALL_TERMINATED'
      });
    } catch (error) {
      console.error('Terminate call error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to terminate call',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/calls/incoming
 * Get incoming call history
 */
router.get('/incoming/history',
  requirePermission('calls', 'read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ max: 255 }).withMessage('Search term too long'),
    query('status').optional().isIn(['pending', 'answered', 'missed', 'rejected']).withMessage('Invalid status'),
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
          { fromNumber: { [Op.iLike]: `%${search}%` } },
          { toNumber: { [Op.iLike]: `%${search}%` } },
          { callSid: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get incoming calls with pagination
      const { rows: incomingCalls, count: totalCalls } = await IncomingCall.findAndCountAll({
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

      const totalPages = Math.ceil(totalCalls / parseInt(limit));
      
      res.status(200).json({
        message: 'Incoming calls retrieved successfully',
        data: {
          incomingCalls,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: totalCalls,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPreviousPage: parseInt(page) > 1
          }
        },
        code: 'INCOMING_CALLS_RETRIEVED'
      });
    } catch (error) {
      console.error('Get incoming calls error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve incoming calls',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/calls/recordings/:callId
 * Get call recording information and download URL
 */
router.get('/recordings/:callId',
  requirePermission('calls', 'read'),
  [
    param('callId').isUUID().withMessage('Invalid call ID format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid call ID',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { callId } = req.params;

      const call = await Call.findByPk(callId);
      if (!call) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Call not found',
          code: 'CALL_NOT_FOUND'
        });
      }

      // Check if recording exists
      const recordingUrl = call.recordingUrl;
      if (!recordingUrl) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No recording available for this call',
          code: 'RECORDING_NOT_FOUND'
        });
      }

      res.status(200).json({
        message: 'Recording information retrieved successfully',
        data: {
          callId,
          recordingUrl,
          duration: call.duration,
          recordingDuration: call.recordingDuration || call.duration,
          format: 'mp3', // Default format
          size: call.recordingSize || null
        },
        code: 'RECORDING_INFO_RETRIEVED'
      });
    } catch (error) {
      console.error('Get recording error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve recording information',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

module.exports = router;