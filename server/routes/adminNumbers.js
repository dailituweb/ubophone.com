
const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { PhoneNumber, UserPhoneNumber, User } = require('../models');
const { adminAuth: authenticateAdmin, checkPermission: requirePermission } = require('../middleware/adminAuth');
const { auditLog } = require('../middleware/adminAudit');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Apply audit logging to all routes
router.use(auditLog({ 
  resource: 'phone_numbers',
  includeRequestBody: true
}));

/**
 * GET /api/admin/numbers
 * Get paginated list of phone numbers with optional filtering
 */
router.get('/', 
  requirePermission('phone_numbers', 'read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ max: 255 }).withMessage('Search term too long'),
    query('status').optional().isIn(['available', 'assigned', 'reserved', 'blocked']).withMessage('Invalid status'),
    query('type').optional().isIn(['local', 'toll-free', 'mobile']).withMessage('Invalid number type'),
    query('country').optional().isLength({ max: 10 }).withMessage('Invalid country code'),
    query('sortBy').optional().isIn(['number', 'price', 'status', 'createdAt']).withMessage('Invalid sort field'),
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
        type,
        country,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }

      if (type) {
        whereClause.type = type;
      }

      if (country) {
        whereClause.country = country;
      }

      if (search) {
        whereClause[Op.or] = [
          { number: { [Op.iLike]: `%${search}%` } },
          { friendlyName: { [Op.iLike]: `%${search}%` } },
          { region: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get phone numbers with pagination
      const { rows: phoneNumbers, count: totalNumbers } = await PhoneNumber.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: UserPhoneNumber,
            as: 'assignments',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'firstName', 'lastName']
              }
            ],
            required: false
          }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      const totalPages = Math.ceil(totalNumbers / parseInt(limit));
      
      res.status(200).json({
        message: 'Phone numbers retrieved successfully',
        data: {
          phoneNumbers,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: totalNumbers,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPreviousPage: parseInt(page) > 1
          }
        },
        code: 'PHONE_NUMBERS_RETRIEVED'
      });
    } catch (error) {
      console.error('Get phone numbers error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve phone numbers',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/numbers/stats
 * Get phone number statistics overview
 */
router.get('/stats/overview',
  requirePermission('phone_numbers', 'read'),
  async (req, res) => {
    try {
      const [numberStats, typeDistribution, countryDistribution] = await Promise.all([
        PhoneNumber.findOne({
          attributes: [
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalNumbers'],
            [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN status = \'available\' THEN 1 END')), 'availableNumbers'],
            [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN status = \'assigned\' THEN 1 END')), 'assignedNumbers'],
            [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN status = \'reserved\' THEN 1 END')), 'reservedNumbers'],
            [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN status = \'blocked\' THEN 1 END')), 'blockedNumbers'],
            [require('sequelize').fn('SUM', require('sequelize').col('monthlyPrice')), 'totalMonthlyRevenue'],
            [require('sequelize').fn('AVG', require('sequelize').col('monthlyPrice')), 'avgMonthlyPrice']
          ],
          raw: true
        }),
        PhoneNumber.findAll({
          attributes: [
            'type',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
            [require('sequelize').fn('SUM', require('sequelize').col('monthlyPrice')), 'revenue']
          ],
          group: ['type'],
          raw: true
        }),
        PhoneNumber.findAll({
          attributes: [
            'country',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
          ],
          group: ['country'],
          order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
          limit: 10,
          raw: true
        })
      ]);

      res.status(200).json({
        message: 'Phone number statistics retrieved successfully',
        data: {
          overview: {
            totalNumbers: parseInt(numberStats?.totalNumbers || 0),
            availableNumbers: parseInt(numberStats?.availableNumbers || 0),
            assignedNumbers: parseInt(numberStats?.assignedNumbers || 0),
            reservedNumbers: parseInt(numberStats?.reservedNumbers || 0),
            blockedNumbers: parseInt(numberStats?.blockedNumbers || 0),
            totalMonthlyRevenue: parseFloat(numberStats?.totalMonthlyRevenue || 0),
            avgMonthlyPrice: parseFloat(numberStats?.avgMonthlyPrice || 0)
          },
          typeDistribution,
          countryDistribution
        },
        code: 'PHONE_NUMBER_STATS_RETRIEVED'
      });
    } catch (error) {
      console.error('Get phone number stats error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve phone number statistics',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * POST /api/admin/numbers
 * Add new phone numbers to the pool
 */
router.post('/',
  requirePermission('phone_numbers', 'write'),
  [
    body('numbers').isArray({ min: 1 }).withMessage('Numbers array is required'),
    body('numbers.*.number').isMobilePhone().withMessage('Invalid phone number format'),
    body('numbers.*.type').isIn(['local', 'toll-free', 'mobile']).withMessage('Invalid number type'),
    body('numbers.*.country').isLength({ min: 2, max: 10 }).withMessage('Country code is required'),
    body('numbers.*.region').optional().isLength({ max: 100 }).withMessage('Region too long'),
    body('numbers.*.monthlyPrice').isFloat({ min: 0 }).withMessage('Monthly price must be non-negative'),
    body('numbers.*.setupFee').optional().isFloat({ min: 0 }).withMessage('Setup fee must be non-negative'),
    body('numbers.*.capabilities').optional().isArray().withMessage('Capabilities must be an array')
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

      const { numbers } = req.body;

      // Check for duplicate numbers
      const existingNumbers = await PhoneNumber.findAll({
        where: {
          number: {
            [Op.in]: numbers.map(n => n.number)
          }
        },
        attributes: ['number']
      });

      const existingNumberSet = new Set(existingNumbers.map(n => n.number));
      const newNumbers = numbers.filter(n => !existingNumberSet.has(n.number));

      if (newNumbers.length === 0) {
        return res.status(400).json({
          error: 'Duplicate Numbers',
          message: 'All provided numbers already exist in the system',
          code: 'DUPLICATE_NUMBERS'
        });
      }

      // Add new numbers
      const createdNumbers = await PhoneNumber.bulkCreate(
        newNumbers.map(number => ({
          ...number,
          status: 'available',
          capabilities: number.capabilities || ['voice', 'sms'],
          metadata: {
            addedBy: req.admin.id,
            addedByUsername: req.admin.username,
            addedAt: new Date().toISOString()
          }
        }))
      );

      res.status(201).json({
        message: 'Phone numbers added successfully',
        data: {
          addedCount: createdNumbers.length,
          skippedCount: numbers.length - createdNumbers.length,
          numbers: createdNumbers
        },
        code: 'PHONE_NUMBERS_ADDED'
      });
    } catch (error) {
      console.error('Add phone numbers error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to add phone numbers',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * PATCH /api/admin/numbers/:id
 * Update phone number details
 */
router.patch('/:id',
  requirePermission('phone_numbers', 'write'),
  [
    param('id').isUUID().withMessage('Invalid phone number ID format'),
    body('status').optional().isIn(['available', 'assigned', 'reserved', 'blocked']).withMessage('Invalid status'),
    body('monthlyPrice').optional().isFloat({ min: 0 }).withMessage('Monthly price must be non-negative'),
    body('setupFee').optional().isFloat({ min: 0 }).withMessage('Setup fee must be non-negative'),
    body('capabilities').optional().isArray().withMessage('Capabilities must be an array'),
    body('region').optional().isLength({ max: 100 }).withMessage('Region too long'),
    body('friendlyName').optional().isLength({ max: 255 }).withMessage('Friendly name too long')
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
      const updateData = req.body;

      const phoneNumber = await PhoneNumber.findByPk(id);
      if (!phoneNumber) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Phone number not found',
          code: 'PHONE_NUMBER_NOT_FOUND'
        });
      }

      // If changing status to 'assigned', check if it has active assignments
      if (updateData.status === 'assigned') {
        const activeAssignment = await UserPhoneNumber.findOne({
          where: {
            phoneNumberId: id,
            status: 'active'
          }
        });

        if (!activeAssignment) {
          return res.status(400).json({
            error: 'Invalid Operation',
            message: 'Cannot set status to assigned without an active assignment',
            code: 'NO_ACTIVE_ASSIGNMENT'
          });
        }
      }

      // Update phone number
      await phoneNumber.update({
        ...updateData,
        metadata: {
          ...phoneNumber.metadata,
          lastModifiedBy: req.admin.id,
          lastModifiedByUsername: req.admin.username,
          lastModifiedAt: new Date().toISOString()
        }
      });

      res.status(200).json({
        message: 'Phone number updated successfully',
        data: { phoneNumber },
        code: 'PHONE_NUMBER_UPDATED'
      });
    } catch (error) {
      console.error('Update phone number error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update phone number',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * POST /api/admin/numbers/:id/assign
 * Assign phone number to a user
 */
router.post('/:id/assign',
  requirePermission('phone_numbers', 'write'),
  [
    param('id').isUUID().withMessage('Invalid phone number ID format'),
    body('userId').isUUID().withMessage('Valid user ID is required'),
    body('type').isIn(['primary', 'secondary']).withMessage('Type must be primary or secondary'),
    body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date format')
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
      const { userId, type, expiryDate } = req.body;

      // Check if phone number exists and is available
      const phoneNumber = await PhoneNumber.findByPk(id);
      if (!phoneNumber) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Phone number not found',
          code: 'PHONE_NUMBER_NOT_FOUND'
        });
      }

      if (phoneNumber.status !== 'available') {
        return res.status(400).json({
          error: 'Invalid Operation',
          message: 'Phone number is not available for assignment',
          code: 'PHONE_NUMBER_NOT_AVAILABLE'
        });
      }

      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user already has a primary number if assigning as primary
      if (type === 'primary') {
        const existingPrimary = await UserPhoneNumber.findOne({
          where: {
            userId,
            type: 'primary',
            status: 'active'
          }
        });

        if (existingPrimary) {
          return res.status(400).json({
            error: 'Conflict',
            message: 'User already has a primary phone number',
            code: 'PRIMARY_NUMBER_EXISTS'
          });
        }
      }

      // Create assignment and update phone number status
      await require('sequelize').transaction(async (t) => {
        await UserPhoneNumber.create({
          userId,
          phoneNumberId: id,
          type,
          status: 'active',
          purchaseDate: new Date(),
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          metadata: {
            assignedBy: req.admin.id,
            assignedByUsername: req.admin.username,
            assignedAt: new Date().toISOString()
          }
        }, { transaction: t });

        await phoneNumber.update({
          status: 'assigned'
        }, { transaction: t });
      });

      res.status(200).json({
        message: 'Phone number assigned successfully',
        data: {
          phoneNumberId: id,
          userId,
          type,
          assignedAt: new Date().toISOString()
        },
        code: 'PHONE_NUMBER_ASSIGNED'
      });
    } catch (error) {
      console.error('Assign phone number error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to assign phone number',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * POST /api/admin/numbers/:id/unassign
 * Unassign phone number from user
 */
router.post('/:id/unassign',
  requirePermission('phone_numbers', 'write'),
  [
    param('id').isUUID().withMessage('Invalid phone number ID format'),
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

      const phoneNumber = await PhoneNumber.findByPk(id);
      if (!phoneNumber) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Phone number not found',
          code: 'PHONE_NUMBER_NOT_FOUND'
        });
      }

      if (phoneNumber.status !== 'assigned') {
        return res.status(400).json({
          error: 'Invalid Operation',
          message: 'Phone number is not currently assigned',
          code: 'PHONE_NUMBER_NOT_ASSIGNED'
        });
      }

      // Find and deactivate assignment
      const assignment = await UserPhoneNumber.findOne({
        where: {
          phoneNumberId: id,
          status: 'active'
        }
      });

      if (!assignment) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No active assignment found',
          code: 'ASSIGNMENT_NOT_FOUND'
        });
      }

      // Update assignment and phone number status
      await require('sequelize').transaction(async (t) => {
        await assignment.update({
          status: 'inactive',
          metadata: {
            ...assignment.metadata,
            unassignedBy: req.admin.id,
            unassignedByUsername: req.admin.username,
            unassignedAt: new Date().toISOString(),
            reason: reason || 'Unassigned by admin'
          }
        }, { transaction: t });

        await phoneNumber.update({
          status: 'available'
        }, { transaction: t });
      });

      res.status(200).json({
        message: 'Phone number unassigned successfully',
        data: {
          phoneNumberId: id,
          userId: assignment.userId,
          unassignedAt: new Date().toISOString(),
          reason: reason || 'Unassigned by admin'
        },
        code: 'PHONE_NUMBER_UNASSIGNED'
      });
    } catch (error) {
      console.error('Unassign phone number error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to unassign phone number',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/admin/numbers/:id
 * Remove phone number from pool
 */
router.delete('/:id',
  requirePermission('phone_numbers', 'delete'),
  [
    param('id').isUUID().withMessage('Invalid phone number ID format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid phone number ID',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { id } = req.params;

      const phoneNumber = await PhoneNumber.findByPk(id);
      if (!phoneNumber) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Phone number not found',
          code: 'PHONE_NUMBER_NOT_FOUND'
        });
      }

      if (phoneNumber.status === 'assigned') {
        return res.status(400).json({
          error: 'Invalid Operation',
          message: 'Cannot delete assigned phone number. Unassign first.',
          code: 'PHONE_NUMBER_ASSIGNED'
        });
      }

      await phoneNumber.destroy();

      res.status(200).json({
        message: 'Phone number removed successfully',
        data: { phoneNumberId: id },
        code: 'PHONE_NUMBER_REMOVED'
      });
    } catch (error) {
      console.error('Remove phone number error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to remove phone number',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

module.exports = router;