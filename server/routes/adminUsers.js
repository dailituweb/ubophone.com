
const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User, Call, Payment, UserPhoneNumber } = require('../models');
const { adminAuth: authenticateAdmin, checkPermission: requirePermission } = require('../middleware/adminAuth');
const { auditLog } = require('../middleware/adminAudit');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Apply audit logging to all routes
router.use(auditLog({ 
  resource: 'users',
  includeRequestBody: true
}));

/**
 * GET /api/admin/users
 * Get paginated list of users with optional filtering
 */
router.get('/', 
  requirePermission('users', 'read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ max: 255 }).withMessage('Search term too long'),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
    query('sortBy').optional().isIn(['createdAt', 'lastLogin', 'username', 'email', 'balance']).withMessage('Invalid sort field'),
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
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const whereClause = {};
      
      if (status) {
        whereClause.isActive = status === 'active';
      }

      if (search) {
        whereClause[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get users with pagination
      const { rows: users, count: totalUsers } = await User.findAndCountAll({
        where: whereClause,
        attributes: [
          'id', 'username', 'email', 'firstName', 'lastName', 
          'balance', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      // Get additional statistics
      const totalPages = Math.ceil(totalUsers / parseInt(limit));
      
      res.status(200).json({
        message: 'Users retrieved successfully',
        data: {
          users,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: totalUsers,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPreviousPage: parseInt(page) > 1
          }
        },
        code: 'USERS_RETRIEVED'
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve users',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/users/:id
 * Get detailed user information
 */
router.get('/:id',
  requirePermission('users', 'read'),
  [
    param('id').isUUID().withMessage('Invalid user ID format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid user ID',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: UserPhoneNumber,
            as: 'phoneNumbers',
            attributes: ['id', 'phoneNumber', 'type', 'status', 'purchaseDate', 'expiryDate']
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Get user statistics
      const [callStats, paymentStats] = await Promise.all([
        Call.findOne({
          where: { userId: id },
          attributes: [
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalCalls'],
            [require('sequelize').fn('SUM', require('sequelize').col('duration')), 'totalMinutes'],
            [require('sequelize').fn('SUM', require('sequelize').col('cost')), 'totalCost']
          ],
          raw: true
        }),
        Payment.findOne({
          where: { 
            userId: id,
            status: 'completed'
          },
          attributes: [
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalPayments'],
            [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalSpent']
          ],
          raw: true
        })
      ]);

      res.status(200).json({
        message: 'User details retrieved successfully',
        data: {
          user,
          statistics: {
            calls: {
              total: parseInt(callStats?.totalCalls || 0),
              totalMinutes: parseInt(callStats?.totalMinutes || 0),
              totalCost: parseFloat(callStats?.totalCost || 0)
            },
            payments: {
              total: parseInt(paymentStats?.totalPayments || 0),
              totalSpent: parseFloat(paymentStats?.totalSpent || 0)
            }
          }
        },
        code: 'USER_DETAILS_RETRIEVED'
      });
    } catch (error) {
      console.error('Get user details error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve user details',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * PATCH /api/admin/users/:id
 * Update user information
 */
router.patch('/:id',
  requirePermission('users', 'write'),
  [
    param('id').isUUID().withMessage('Invalid user ID format'),
    body('username').optional().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
    body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    body('balance').optional().isFloat({ min: 0 }).withMessage('Balance must be non-negative')
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

      // Check if user exists
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check for unique constraints if updating username or email
      if (updateData.username || updateData.email) {
        const conflictWhere = {
          id: { [Op.ne]: id }
        };

        if (updateData.username) {
          conflictWhere.username = updateData.username;
        }
        if (updateData.email) {
          conflictWhere.email = updateData.email;
        }

        const existingUser = await User.findOne({
          where: conflictWhere
        });

        if (existingUser) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Username or email already exists',
            code: 'DUPLICATE_USER'
          });
        }
      }

      // Update user
      await user.update(updateData);

      // Get updated user data
      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      res.status(200).json({
        message: 'User updated successfully',
        data: { user: updatedUser },
        code: 'USER_UPDATED'
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update user',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * POST /api/admin/users/:id/adjust-balance
 * Adjust user balance (add or subtract credits)
 */
router.post('/:id/adjust-balance',
  requirePermission('users', 'write'),
  [
    param('id').isUUID().withMessage('Invalid user ID format'),
    body('amount').isFloat().withMessage('Amount must be a number'),
    body('reason').notEmpty().isLength({ max: 255 }).withMessage('Reason is required and must be under 255 characters'),
    body('type').isIn(['credit', 'debit']).withMessage('Type must be credit or debit')
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

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const adjustmentAmount = type === 'credit' ? Math.abs(amount) : -Math.abs(amount);
      const newBalance = parseFloat(user.balance) + adjustmentAmount;

      if (newBalance < 0) {
        return res.status(400).json({
          error: 'Invalid Operation',
          message: 'Balance cannot be negative',
          code: 'NEGATIVE_BALANCE'
        });
      }

      // Update balance
      await user.update({ balance: newBalance });

      // Create payment record for audit trail
      await Payment.create({
        userId: id,
        amount: Math.abs(amount),
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'admin_adjustment',
        type: `admin_${type}`,
        description: reason,
        metadata: {
          adjustedBy: req.admin.id,
          adjustedByUsername: req.admin.username,
          previousBalance: user.balance,
          newBalance: newBalance,
          timestamp: new Date().toISOString()
        }
      });

      res.status(200).json({
        message: 'Balance adjusted successfully',
        data: {
          userId: id,
          previousBalance: parseFloat(user.balance),
          adjustment: adjustmentAmount,
          newBalance: newBalance,
          reason
        },
        code: 'BALANCE_ADJUSTED'
      });
    } catch (error) {
      console.error('Balance adjustment error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to adjust balance',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/admin/users/:id
 * Soft delete user account
 */
router.delete('/:id',
  requirePermission('users', 'delete'),
  [
    param('id').isUUID().withMessage('Invalid user ID format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid user ID',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Soft delete by deactivating the user
      await user.update({ isActive: false });

      res.status(200).json({
        message: 'User deactivated successfully',
        data: { userId: id },
        code: 'USER_DEACTIVATED'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to deactivate user',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/admin/users/stats/overview
 * Get user statistics overview
 */
router.get('/stats/overview',
  requirePermission('users', 'read'),
  async (req, res) => {
    try {
      const [userStats, recentUsers] = await Promise.all([
        User.findOne({
          attributes: [
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalUsers'],
            [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN "isActive" = true THEN 1 END')), 'activeUsers'],
            [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN "isActive" = false THEN 1 END')), 'inactiveUsers'],
            [require('sequelize').fn('SUM', require('sequelize').col('balance')), 'totalBalance']
          ],
          raw: true
        }),
        User.findAll({
          attributes: ['id', 'username', 'email', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit: 5
        })
      ]);

      res.status(200).json({
        message: 'User statistics retrieved successfully',
        data: {
          overview: {
            totalUsers: parseInt(userStats.totalUsers || 0),
            activeUsers: parseInt(userStats.activeUsers || 0),
            inactiveUsers: parseInt(userStats.inactiveUsers || 0),
            totalBalance: parseFloat(userStats.totalBalance || 0)
          },
          recentUsers
        },
        code: 'USER_STATS_RETRIEVED'
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve user statistics',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

module.exports = router;