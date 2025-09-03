const express = require('express');
const { Op } = require('sequelize');
const { User, Call, IncomingCall, Payment, CallRecording, AdminAuditLog } = require('../models');
const { adminAuth, checkPermission } = require('../middleware/adminAuth');

const router = express.Router();

// 记录管理员操作的辅助函数
const logAdminAction = async (adminId, action, resource, resourceId, details, req) => {
  try {
    await AdminAuditLog.create({
      adminId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

// ===== 仪表板数据 =====
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // 并行查询所有数据
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      totalCalls,
      callsToday,
      totalRevenue,
      revenueToday,
      onlineUsers
    ] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      User.count({ where: { createdAt: { [Op.gte]: today } } }),
      Call.count(),
      Call.count({ where: { createdAt: { [Op.gte]: today } } }),
      Payment.sum('amount') || 0,
      Payment.sum('amount', { where: { createdAt: { [Op.gte]: today } } }) || 0,
      // 这里可以添加在线用户统计逻辑
      0
    ]);

    // 最近7天的数据趋势
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const [callCount, revenue] = await Promise.all([
        Call.count({ 
          where: { 
            createdAt: { 
              [Op.gte]: date,
              [Op.lt]: nextDate
            } 
          } 
        }),
        Payment.sum('amount', { 
          where: { 
            createdAt: { 
              [Op.gte]: date,
              [Op.lt]: nextDate
            } 
          } 
        }) || 0
      ]);
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        calls: callCount,
        revenue: parseFloat(revenue)
      });
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          newUsersToday,
          totalCalls,
          callsToday,
          totalRevenue: parseFloat(totalRevenue),
          revenueToday: parseFloat(revenueToday),
          onlineUsers
        },
        trends: last7Days
      }
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard data',
      code: 'DASHBOARD_ERROR' 
    });
  }
});

// ===== 用户管理 =====
// 获取用户统计数据
router.get('/users/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth
    ] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      User.count({ where: { isActive: false } }),
      User.count({ where: { isActive: false, suspended: true } }),
      User.count({ 
        where: { 
          createdAt: { 
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) 
          } 
        } 
      }),
      User.count({ 
        where: { 
          createdAt: { 
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
          } 
        } 
      }),
      User.count({ 
        where: { 
          createdAt: { 
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          } 
        } 
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user stats',
      code: 'USER_STATS_ERROR' 
    });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 搜索条件
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 状态筛选
    if (status !== 'all') {
      where.isActive = status === 'active';
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset
    });

    // 优化：批量获取所有用户的通话统计，避免N+1查询
    const userIds = rows.map(user => user.id);
    const callStats = await Call.findAll({
      where: { userId: { [Op.in]: userIds } },
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCalls']
      ],
      group: ['userId'],
      raw: true
    });

    // 创建用户ID到通话数量的映射
    const callStatsMap = callStats.reduce((acc, stat) => {
      acc[stat.userId] = parseInt(stat.totalCalls) || 0;
      return acc;
    }, {});

    // 为每个用户添加通话统计
    const usersWithStats = rows.map(user => ({
      ...user.toJSON(),
      totalCalls: callStatsMap[user.id] || 0
    }));

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users',
      code: 'USERS_ERROR' 
    });
  }
});

// 获取用户详情
router.get('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    // 获取用户的通话统计
    const [callCount, totalDuration, totalSpent] = await Promise.all([
      Call.count({ where: { userId } }),
      Call.sum('duration', { where: { userId } }) || 0,
      Call.sum('cost', { where: { userId } }) || 0
    ]);

    // 获取最近的通话记录
    const recentCalls = await Call.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'toNumber', 'duration', 'cost', 'status', 'createdAt']
    });

    res.json({
      success: true,
      data: {
        user,
        stats: {
          callCount,
          totalDuration: parseInt(totalDuration),
          totalSpent: parseFloat(totalSpent)
        },
        recentCalls
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user details',
      code: 'USER_DETAILS_ERROR' 
    });
  }
});

// 更新用户状态
router.patch('/users/:userId/status', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    await user.update({ isActive });

    // 记录操作日志
    await logAdminAction(
      req.admin.id,
      'update_user_status',
      'user',
      userId,
      { 
        oldStatus: user.isActive,
        newStatus: isActive,
        username: user.username 
      },
      req
    );

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ 
      message: 'Failed to update user status',
      code: 'UPDATE_STATUS_ERROR' 
    });
  }
});

// 用户操作端点
router.post('/users/:userId/:action', adminAuth, async (req, res) => {
  try {
    const { userId, action } = req.params;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    switch (action) {
      case 'activate':
        await user.update({ isActive: true });
        await logAdminAction(req.admin.id, 'activate_user', 'user', userId, { username: user.username }, req);
        res.json({ success: true, message: 'User activated successfully' });
        break;
        
      case 'deactivate':
        await user.update({ isActive: false });
        await logAdminAction(req.admin.id, 'deactivate_user', 'user', userId, { username: user.username }, req);
        res.json({ success: true, message: 'User deactivated successfully' });
        break;
        
      case 'view':
        // Return user details
        const [callCount, totalDuration, totalSpent] = await Promise.all([
          Call.count({ where: { userId } }),
          Call.sum('duration', { where: { userId } }) || 0,
          Call.sum('cost', { where: { userId } }) || 0
        ]);
        
        const recentCalls = await Call.findAll({
          where: { userId },
          order: [['createdAt', 'DESC']],
          limit: 10,
          attributes: ['id', 'toNumber', 'duration', 'cost', 'status', 'createdAt']
        });
        
        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              balance: user.balance,
              isActive: user.isActive,
              createdAt: user.createdAt,
              lastLogin: user.lastLogin
            },
            stats: {
              callCount,
              totalDuration: parseInt(totalDuration),
              totalSpent: parseFloat(totalSpent)
            },
            recentCalls
          }
        });
        break;
        
      case 'adjust-balance':
        const { amount, reason } = req.body;
        
        if (!amount || !reason) {
          return res.status(400).json({ 
            message: 'Amount and reason are required',
            code: 'MISSING_FIELDS' 
          });
        }
        
        const oldBalance = parseFloat(user.balance);
        const newBalance = oldBalance + parseFloat(amount);
        
        if (newBalance < 0) {
          return res.status(400).json({ 
            message: 'Insufficient balance',
            code: 'INSUFFICIENT_BALANCE' 
          });
        }
        
        await user.update({ balance: newBalance });
        await logAdminAction(req.admin.id, 'adjust_balance', 'user', userId, { 
          oldBalance, newBalance, adjustment: parseFloat(amount), reason, username: user.username 
        }, req);
        
        res.json({
          success: true,
          message: 'Balance adjusted successfully',
          data: { oldBalance, newBalance, adjustment: parseFloat(amount) }
        });
        break;
        
      case 'delete':
        // Soft delete - just deactivate
        await user.update({ isActive: false });
        await logAdminAction(req.admin.id, 'delete_user', 'user', userId, { username: user.username }, req);
        res.json({ success: true, message: 'User deleted successfully' });
        break;
        
      default:
        res.status(400).json({ message: 'Invalid action', code: 'INVALID_ACTION' });
    }
    
  } catch (error) {
    console.error('User action error:', error);
    res.status(500).json({ 
      message: 'Failed to perform user action',
      code: 'USER_ACTION_ERROR' 
    });
  }
});

// 调整用户余额
router.patch('/users/:userId/balance', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || !reason) {
      return res.status(400).json({ 
        message: 'Amount and reason are required',
        code: 'MISSING_FIELDS' 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    const oldBalance = parseFloat(user.balance);
    const newBalance = oldBalance + parseFloat(amount);

    if (newBalance < 0) {
      return res.status(400).json({ 
        message: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE' 
      });
    }

    await user.update({ balance: newBalance });

    // 记录操作日志
    await logAdminAction(
      req.admin.id,
      'adjust_balance',
      'user',
      userId,
      { 
        oldBalance,
        newBalance,
        adjustment: parseFloat(amount),
        reason,
        username: user.username 
      },
      req
    );

    res.json({
      success: true,
      message: 'Balance adjusted successfully',
      data: {
        oldBalance,
        newBalance,
        adjustment: parseFloat(amount)
      }
    });

  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({ 
      message: 'Failed to adjust balance',
      code: 'BALANCE_ADJUSTMENT_ERROR' 
    });
  }
});

// ===== 通话记录管理 =====
// 获取通话记录统计
router.get('/calls/stats', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const [
      totalCalls,
      outgoingCalls,
      incomingCalls,
      completedCalls,
      failedCalls,
      totalDuration,
      totalCost
    ] = await Promise.all([
      // Total calls (both outgoing and incoming)
      Promise.all([
        Call.count({ where }),
        IncomingCall.count({ where })
      ]).then(([outgoing, incoming]) => outgoing + incoming),
      
      // Outgoing calls
      Call.count({ where }),
      
      // Incoming calls
      IncomingCall.count({ where }),
      
      // Completed calls
      Promise.all([
        Call.count({ where: { ...where, status: 'completed' } }),
        IncomingCall.count({ where: { ...where, status: 'completed' } })
      ]).then(([outgoing, incoming]) => outgoing + incoming),
      
      // Failed calls
      Promise.all([
        Call.count({ where: { ...where, status: { [Op.in]: ['failed', 'canceled', 'busy', 'no-answer'] } } }),
        IncomingCall.count({ where: { ...where, status: { [Op.in]: ['failed', 'canceled', 'busy', 'no-answer'] } } })
      ]).then(([outgoing, incoming]) => outgoing + incoming),
      
      // Total duration (seconds)
      Promise.all([
        Call.sum('duration', { where }) || 0,
        IncomingCall.sum('duration', { where }) || 0
      ]).then(([outgoing, incoming]) => outgoing + incoming),
      
      // Total cost
      Call.sum('cost', { where }) || 0
    ]);

    res.json({
      success: true,
      data: {
        total: totalCalls,
        outgoing: outgoingCalls,
        incoming: incomingCalls,
        completed: completedCalls,
        failed: failedCalls,
        totalDuration: parseInt(totalDuration),
        totalCost: parseFloat(totalCost)
      }
    });

  } catch (error) {
    console.error('Get call stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch call stats',
      code: 'CALL_STATS_ERROR' 
    });
  }
});

router.get('/calls', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type = 'all',
      status = 'all',
      search = '',
      startDate,
      endDate
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 日期范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // 状态筛选
    if (status !== 'all') {
      where.status = status;
    }

    // 搜索条件
    if (search) {
      where[Op.or] = [
        { toNumber: { [Op.iLike]: `%${search}%` } },
        { fromNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }

    let calls;
    
    if (type === 'incoming') {
      // 查询来电记录
      const { count, rows } = await IncomingCall.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });
      
      calls = { count, rows };
    } else if (type === 'outgoing') {
      // 查询外拨记录
      const { count, rows } = await Call.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });
      
      calls = { count, rows };
    } else {
      // 查询所有通话记录 - 这里需要合并两个表的数据
      const [outgoingCalls, incomingCalls] = await Promise.all([
        Call.findAll({
          where,
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }],
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit),
          offset: offset
        }),
        IncomingCall.findAll({
          where,
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }],
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit),
          offset: offset
        })
      ]);

      // 合并并按时间排序
      const allCalls = [...outgoingCalls, ...incomingCalls]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, parseInt(limit));

      const totalCount = await Call.count({ where }) + await IncomingCall.count({ where });
      
      calls = { count: totalCount, rows: allCalls };
    }

    res.json({
      success: true,
      data: {
        calls: calls.rows,
        pagination: {
          total: calls.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(calls.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch calls',
      code: 'CALLS_ERROR' 
    });
  }
});

// ===== 财务数据管理 =====
router.get('/finance/overview', adminAuth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const [
      totalRevenue,
      callRevenue,
      rechargeRevenue,
      totalTransactions,
      avgTransactionAmount
    ] = await Promise.all([
      Payment.sum('amount', { 
        where: { 
          createdAt: { [Op.gte]: startDate },
          status: 'completed'
        } 
      }) || 0,
      Call.sum('cost', { 
        where: { 
          createdAt: { [Op.gte]: startDate }
        } 
      }) || 0,
      Payment.sum('amount', { 
        where: { 
          createdAt: { [Op.gte]: startDate },
          type: 'recharge',
          status: 'completed'
        } 
      }) || 0,
      Payment.count({ 
        where: { 
          createdAt: { [Op.gte]: startDate },
          status: 'completed'
        } 
      }),
      Payment.findAll({
        where: { 
          createdAt: { [Op.gte]: startDate },
          status: 'completed'
        },
        attributes: ['amount']
      }).then(payments => {
        if (payments.length === 0) return 0;
        const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        return total / payments.length;
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalRevenue: parseFloat(totalRevenue),
          callRevenue: parseFloat(callRevenue),
          rechargeRevenue: parseFloat(rechargeRevenue),
          totalTransactions,
          avgTransactionAmount: parseFloat(avgTransactionAmount)
        },
        period
      }
    });

  } catch (error) {
    console.error('Finance overview error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch finance overview',
      code: 'FINANCE_ERROR' 
    });
  }
});

// ===== 系统统计 =====
router.get('/system/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalCalls,
      totalCallDuration,
      totalRecordings,
      avgCallDuration
    ] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      Call.count(),
      Call.sum('duration') || 0,
      CallRecording.count(),
      Call.findAll({ attributes: ['duration'] }).then(calls => {
        if (calls.length === 0) return 0;
        const total = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
        return total / calls.length;
      })
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        calls: {
          total: totalCalls,
          totalDuration: parseInt(totalCallDuration),
          avgDuration: parseFloat(avgCallDuration)
        },
        recordings: {
          total: totalRecordings
        }
      }
    });

  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch system stats',
      code: 'SYSTEM_STATS_ERROR' 
    });
  }
});

module.exports = router; 