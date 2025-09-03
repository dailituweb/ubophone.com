const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { Admin, AdminRole, AdminAuditLog, AdminSession } = require('./Admin');

// 用户模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // Changed to allow null for social login
  },
  balance: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0.0000
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Password reset fields
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Google OAuth fields
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      recordCalls: true,
      incomingCalls: true,
      notifications: true,
      autoAnswer: false
    }
  },
  defaultCallerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'user_phone_numbers',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'users'
});

// 通话记录模型
const Call = sequelize.define('Call', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  callSid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  fromNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  toNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  direction: {
    type: DataTypes.ENUM('outbound', 'inbound'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('queued', 'ringing', 'in-progress', 'answered', 'completed', 'busy', 'failed', 'no-answer', 'canceled'),
    defaultValue: 'queued'
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0 // 秒
  },
  cost: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0.0000
  },
  rate: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0.02
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  answeredBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hangupCause: {
    type: DataTypes.STRING,
    allowNull: true
  },
  qualityScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  // Enhanced call quality analysis fields
  audioQuality: {
    type: DataTypes.JSONB,
    defaultValue: {
      mos: null,           // Mean Opinion Score (1-5)
      jitter: null,        // Network jitter in ms
      latency: null,       // Round trip time in ms
      packetLoss: null,    // Packet loss percentage
      audioLevel: null,    // Average audio level
      echoCancellation: null, // Echo cancellation status
      noiseSuppression: null  // Noise suppression status
    }
  },
  networkAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {
      connectionType: null,    // wifi, cellular, ethernet
      signalStrength: null,    // Signal strength percentage
      bandwidth: null,         // Available bandwidth
      codecUsed: null,         // Audio codec used
      rtpStats: null          // RTP statistics
    }
  },
  // Recording related fields
  recordingUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recordingSid: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hasRecording: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'calls',
  indexes: [
    {
      fields: ['userId', 'startTime'], // Main analytics query
      name: 'calls_user_start_time_idx'
    },
    {
      fields: ['userId', 'status'], // User call status queries
      name: 'calls_user_status_idx'
    },
    {
      fields: ['userId', 'country'], // Country-based analytics
      name: 'calls_user_country_idx'
    },
    {
      fields: ['startTime'], // Date-based queries
      name: 'calls_start_time_idx'
    },
    {
      fields: ['callSid'], // Unique call lookups
      name: 'calls_call_sid_idx'
    }
  ]
});

// 通话录音模型
const CallRecording = sequelize.define('CallRecording', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  callId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Call,
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  recordingSid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  recordingUrl: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0 // 秒
  },
  fileSize: {
    type: DataTypes.BIGINT,
    defaultValue: 0 // 字节
  },
  format: {
    type: DataTypes.STRING,
    defaultValue: 'mp3'
  },
  channels: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('processing', 'completed', 'failed', 'deleted'),
    defaultValue: 'processing'
  },
  transcription: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  // Enhanced audio analysis fields
  audioAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {
      waveform: null,         // Audio waveform data for visualization
      peaks: null,            // Audio peaks for timeline
      frequency: null,        // Frequency analysis
      volume: null,           // Volume levels over time
      silenceDetection: null, // Silent periods in the recording
      speechToText: null,     // Speech recognition results
      sentiment: null,        // Sentiment analysis of conversation
      keywords: null,         // Extracted keywords
      speakerDiarization: null // Speaker identification
    }
  },
  qualityMetrics: {
    type: DataTypes.JSONB,
    defaultValue: {
      clarity: null,          // Audio clarity score (1-10)
      backgroundNoise: null,  // Background noise level
      speechQuality: null,    // Speech quality score
      audioDistortion: null,  // Distortion level
      recordingQuality: null  // Overall recording quality
    }
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastDownloaded: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastPlayed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  playCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expiresAt: {
    type: DataTypes.DATE,
    defaultValue: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90天
  }
}, {
  timestamps: true,
  tableName: 'call_recordings'
});

// 支付记录模型
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false // 'stripe', 'paypal', etc.
  },
  paymentIntentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true // 'credit_purchase', 'phone_purchase', etc.
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: true // 'Stripe', 'PayPal', etc.
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'payments'
});

// 来电设置模型
const IncomingCallSettings = sequelize.define('IncomingCallSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  twilioNumber: {
    type: DataTypes.STRING,
    allowNull: false // 分配给用户的Twilio号码
  },
  forwardingEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  forwardingNumber: {
    type: DataTypes.STRING,
    allowNull: true // 转接号码
  },
  voicemailEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  autoAnswer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  businessHours: {
    type: DataTypes.JSONB,
    defaultValue: {
      enabled: false,
      timezone: 'UTC',
      hours: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '17:00', enabled: true },
        saturday: { start: '09:00', end: '17:00', enabled: false },
        sunday: { start: '09:00', end: '17:00', enabled: false }
      }
    }
  },
  customGreeting: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'incoming_call_settings'
});

// 通话分析模型
const CallAnalytics = sequelize.define('CallAnalytics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  callId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Call,
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  audioQuality: {
    type: DataTypes.JSONB,
    defaultValue: {
      jitter: null,
      latency: null,
      packetLoss: null,
      mos: null // Mean Opinion Score
    }
  },
  networkStats: {
    type: DataTypes.JSONB,
    defaultValue: {
      bandwidth: null,
      codec: null,
      rtt: null // Round Trip Time
    }
  },
  sentiment: {
    type: DataTypes.JSONB,
    defaultValue: {
      overall: null, // positive, negative, neutral
      confidence: null,
      keywords: []
    }
  },
  speechAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {
      talkTime: null,
      silenceTime: null,
      interruptionCount: null,
      averagePause: null
    }
  },
  conversationInsights: {
    type: DataTypes.JSONB,
    defaultValue: {
      topics: [],
      summary: null,
      actionItems: []
    }
  }
}, {
  timestamps: true,
  tableName: 'call_analytics'
});

// 订阅计划模型
const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false // 'Basic', 'Premium', 'Enterprise'
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'quarterly', 'annually'),
    allowNull: false
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: {
      monthlyCredits: 0,      // Monthly credit allowance
      callRateDiscount: 0,    // Percentage discount on call rates
      freeMinutes: 0,         // Free minutes per month
      prioritySupport: false, // Priority customer support
      recordingStorage: 30,   // Days of recording storage
      qualityAnalytics: false, // Advanced quality analytics
      apiAccess: false,       // API access
      customFeatures: []      // Array of custom features
    }
  },
  stripePriceId: {
    type: DataTypes.STRING,
    allowNull: true // Stripe price ID for recurring billing
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  trialDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0 // Free trial period in days
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0 // For sorting plans in UI
  }
}, {
  timestamps: true,
  tableName: 'subscription_plans'
});

// 用户订阅模型
const UserSubscription = sequelize.define('UserSubscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  planId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: SubscriptionPlan,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'canceled', 'past_due', 'trialing', 'paused'),
    allowNull: false,
    defaultValue: 'active'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextBillingDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  trialEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cancelAtPeriodEnd: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  cancelReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Monthly allowances and usage tracking
  currentPeriodStart: {
    type: DataTypes.DATE,
    allowNull: true
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: true
  },
  creditsUsed: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  minutesUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'user_subscriptions'
});

// 优惠券模型
const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('percentage', 'fixed_amount', 'free_credits', 'free_trial'),
    allowNull: false
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  // Usage limits
  maxUses: {
    type: DataTypes.INTEGER,
    allowNull: true // null = unlimited
  },
  usedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxUsesPerUser: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  // Date restrictions
  validFrom: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  validUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Applicable to
  applicableToPlans: {
    type: DataTypes.JSONB,
    defaultValue: [] // Array of plan IDs, empty = all plans
  },
  applicableToProducts: {
    type: DataTypes.JSONB,
    defaultValue: [] // Array of product types: ['subscription', 'credits', 'calls']
  },
  minimumAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  // Status and settings
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // Whether shown in promotions
  },
  // Advanced features
  stackable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // Can be used with other coupons
  },
  autoApply: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // Automatically apply for eligible users
  },
  userSegments: {
    type: DataTypes.JSONB,
    defaultValue: [] // Target specific user segments
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'coupons'
});

// 优惠券使用记录模型
const CouponUsage = sequelize.define('CouponUsage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  couponId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Coupon,
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: true // Reference to payment or subscription
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  originalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  finalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  context: {
    type: DataTypes.ENUM('subscription', 'credits', 'calls'),
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'coupon_usages'
});

// 促销活动模型
const Promotion = sequelize.define('Promotion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('welcome_bonus', 'referral', 'seasonal', 'loyalty', 'winback'),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rules: {
    type: DataTypes.JSONB,
    defaultValue: {
      targetAudience: 'all', // 'new_users', 'existing_users', 'inactive_users'
      triggerEvent: null,    // 'signup', 'first_purchase', 'referral'
      conditions: [],        // Array of conditions
      rewards: []            // Array of rewards
    }
  },
  coupons: {
    type: DataTypes.JSONB,
    defaultValue: [] // Array of coupon IDs associated with this promotion
  },
  analytics: {
    type: DataTypes.JSONB,
    defaultValue: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      totalDiscount: 0,
      revenue: 0
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'promotions'
});

// 联系人模型
const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastCalled: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'contacts'
});

// 用户电话号码模型
const UserPhoneNumber = sequelize.define('UserPhoneNumber', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // 每个号码只能属于一个用户
  },
  type: {
    type: DataTypes.ENUM('dedicated', 'shared', 'trial'),
    allowNull: false,
    defaultValue: 'dedicated'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'expired', 'suspended'),
    allowNull: false,
    defaultValue: 'active'
  },
  // Twilio相关信息
  twilioSid: {
    type: DataTypes.STRING,
    allowNull: true // Twilio Phone Number SID
  },
  capabilities: {
    type: DataTypes.JSONB,
    defaultValue: {
      voice: true,
      sms: false,
      mms: false,
      fax: false
    }
  },
  // 购买和计费信息
  purchaseDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true // null表示永久有效
  },
  monthlyFee: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 1.0000 // 每月费用
  },
  setupFee: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0.0000
  },
  // 地理位置信息
  locality: {
    type: DataTypes.STRING,
    allowNull: true // 城市名称，如 "New York"
  },
  region: {
    type: DataTypes.STRING,
    allowNull: true // 州/省份，如 "NY" 或 "United States"
  },
  isoCountry: {
    type: DataTypes.STRING(2),
    allowNull: true // 国家代码，如 "US", "CA"
  },
  // 来电设置
  callerIdName: {
    type: DataTypes.STRING,
    allowNull: true // 自定义来电显示名称
  },
  forwardingEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  forwardingNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  voicemailEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  autoAnswer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // 使用统计
  totalIncomingCalls: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalIncomingMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalIncomingSeconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalAnsweredCalls: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastIncomingCall: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // 高级设置
  businessHours: {
    type: DataTypes.JSONB,
    defaultValue: {
      enabled: false,
      timezone: 'UTC',
      hours: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '17:00', enabled: true },
        saturday: { start: '09:00', end: '17:00', enabled: false },
        sunday: { start: '09:00', end: '17:00', enabled: false }
      }
    }
  },
  customGreeting: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  // 布尔字段：是否为默认来电显示号码
  isDefaultCallerId: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否为用户的默认来电显示号码'
  },
  // 标签和备注字段
  label: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '用户自定义标签，支持逗号分隔的多个标签，如"工作,个人,客服"等'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户添加的备注信息'
  }
}, {
  timestamps: true,
  tableName: 'user_phone_numbers',
  indexes: [
    {
      fields: ['userId'],
      name: 'user_phone_numbers_user_id_idx'
    },
    {
      fields: ['phoneNumber'],
      name: 'user_phone_numbers_phone_number_idx'
    },
    {
      fields: ['status'],
      name: 'user_phone_numbers_status_idx'
    }
  ]
});

// 来电记录模型
const IncomingCall = sequelize.define('IncomingCall', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  userPhoneNumberId: {
    type: DataTypes.UUID,
    allowNull: true, // 可能是共享号码，没有对应的UserPhoneNumber记录
    references: {
      model: UserPhoneNumber,
      key: 'id'
    }
  },
  callId: {
    type: DataTypes.UUID,
    allowNull: true, // 如果通话被接听，会创建Call记录
    references: {
      model: Call,
      key: 'id'
    }
  },
  // 基本通话信息
  callSid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  fromNumber: {
    type: DataTypes.STRING,
    allowNull: false // 主叫号码
  },
  toNumber: {
    type: DataTypes.STRING,
    allowNull: false // 被叫号码（用户的号码）
  },
  // 通话状态
  status: {
    type: DataTypes.ENUM('ringing', 'answered', 'rejected', 'missed', 'busy', 'no-answer', 'failed'),
    allowNull: false,
    defaultValue: 'ringing'
  },
  direction: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'inbound'
  },
  // 时间信息
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  answerTime: {
    type: DataTypes.DATE,
    allowNull: true // 接听时间
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true // 结束时间
  },
  ringDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0 // 响铃时长（秒）
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0 // 通话时长（秒）
  },
  // 来电处理
  handledBy: {
    type: DataTypes.ENUM('user', 'voicemail', 'forwarding', 'auto_reject'),
    allowNull: true
  },
  forwardedTo: {
    type: DataTypes.STRING,
    allowNull: true // 转接到的号码
  },
  // 通话质量和成本
  cost: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0.0000
  },
  rate: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0.0000 // 来电可能免费
  },
  // 位置信息（如果可获取）
  callerLocation: {
    type: DataTypes.JSONB,
    defaultValue: {
      country: null,
      region: null,
      city: null,
      carrier: null
    }
  },
  // 录音信息
  hasRecording: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recordingUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recordingSid: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // 语音邮件
  hasVoicemail: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  voicemailUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  voicemailSid: {
    type: DataTypes.STRING,
    allowNull: true
  },
  voicemailTranscription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // 用户交互
  userNotified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // 是否已通知用户
  },
  userResponse: {
    type: DataTypes.ENUM('answered', 'rejected', 'ignored'),
    allowNull: true
  },
  userResponseTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // 标记和备注
  isSpam: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  userNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'incoming_calls',
  indexes: [
    {
      fields: ['userId', 'startTime'],
      name: 'incoming_calls_user_start_time_idx'
    },
    {
      fields: ['fromNumber'],
      name: 'incoming_calls_from_number_idx'
    },
    {
      fields: ['toNumber'],
      name: 'incoming_calls_to_number_idx'
    },
    {
      fields: ['status'],
      name: 'incoming_calls_status_idx'
    },
    {
      fields: ['callSid'],
      name: 'incoming_calls_call_sid_idx'
    }
  ]
});


// 定义关联关系
User.hasMany(Call, { foreignKey: 'userId', as: 'calls' });
Call.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(IncomingCallSettings, { foreignKey: 'userId', as: 'incomingSettings' });
IncomingCallSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Call.hasOne(CallRecording, { foreignKey: 'callId', as: 'recording' });
CallRecording.belongsTo(Call, { foreignKey: 'callId', as: 'call' });

Call.hasOne(CallAnalytics, { foreignKey: 'callId', as: 'analytics' });
CallAnalytics.belongsTo(Call, { foreignKey: 'callId', as: 'call' });

User.hasMany(CallRecording, { foreignKey: 'userId', as: 'recordings' });
CallRecording.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CallAnalytics, { foreignKey: 'userId', as: 'analytics' });
CallAnalytics.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserSubscription, { foreignKey: 'userId', as: 'subscriptions' });
UserSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

SubscriptionPlan.hasMany(UserSubscription, { foreignKey: 'planId', as: 'subscriptions' });
UserSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });

Coupon.hasMany(CouponUsage, { foreignKey: 'couponId', as: 'usages' });
CouponUsage.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });

User.hasMany(CouponUsage, { foreignKey: 'userId', as: 'couponUsages' });
CouponUsage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Contact, { foreignKey: 'userId' });
Contact.belongsTo(User, { foreignKey: 'userId' });

// 新增模型关联关系
User.hasMany(UserPhoneNumber, { foreignKey: 'userId', as: 'phoneNumbers' });
UserPhoneNumber.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.belongsTo(UserPhoneNumber, { foreignKey: 'defaultCallerId', as: 'defaultCallerIdNumber' });
UserPhoneNumber.hasMany(User, { foreignKey: 'defaultCallerId', as: 'usersUsingAsDefaultCallerId' });

User.hasMany(IncomingCall, { foreignKey: 'userId', as: 'incomingCalls' });
IncomingCall.belongsTo(User, { foreignKey: 'userId', as: 'user' });

UserPhoneNumber.hasMany(IncomingCall, { foreignKey: 'userPhoneNumberId', as: 'incomingCalls' });
IncomingCall.belongsTo(UserPhoneNumber, { foreignKey: 'userPhoneNumberId', as: 'phoneNumber' });

Call.hasOne(IncomingCall, { foreignKey: 'callId', as: 'incomingCall' });
IncomingCall.belongsTo(Call, { foreignKey: 'callId', as: 'call' });

// 数据库健康检查函数
const performDatabaseHealthCheck = async () => {
  try {
    console.log('🏥 Performing database health check...');
    
    // 检查关键表是否存在
    const criticalTables = [
      'users', 'calls', 'call_recordings', 'payments', 
      'admins', 'admin_roles', 'admin_sessions', 'admin_audit_logs',
      'user_phone_numbers', 'incoming_calls'
    ];
    
    const existingTables = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (${criticalTables.map(t => `'${t}'`).join(',')})
    `, { type: sequelize.QueryTypes.SELECT });
    
    const existingTableNames = existingTables.map(t => t.table_name);
    const missingTables = criticalTables.filter(t => !existingTableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.warn('⚠️ Missing critical tables:', missingTables);
    } else {
      console.log('✅ All critical tables exist');
    }
    
    // 检查外键约束
    const foreignKeys = await sequelize.query(`
      SELECT COUNT(*) as count FROM information_schema.table_constraints 
      WHERE constraint_type = 'FOREIGN KEY' 
      AND table_schema = 'public'
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`🔗 Found ${foreignKeys[0].count} foreign key constraints`);
    
    // 检查索引数量
    const indexes = await sequelize.query(`
      SELECT COUNT(*) as count FROM pg_indexes 
      WHERE schemaname = 'public'
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`📇 Found ${indexes[0].count} database indexes`);
    
    console.log('🏥 Database health check completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    return false;
  }
};

// 简化的外键约束函数 - 大部分修复已移到Migration
const addForeignKeyConstraints = async () => {
  try {
    console.log('🔧 Checking critical foreign key constraints...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // 只检查最关键的约束，不进行复杂的修复
    // 复杂的结构修复已经移动到Migration中
    
    // 检查admin_roles表是否存在，如果不存在则跳过admin相关检查
    const adminRolesExists = await queryInterface.tableExists('admin_roles');
    const adminsExists = await queryInterface.tableExists('admins');
    
    if (!adminRolesExists && adminsExists) {
      console.warn('⚠️ Warning: admins table exists but admin_roles table is missing');
      console.warn('⚠️ Please run migrations to fix database structure');
    }
    
    // 简单的完整性检查
    if (adminRolesExists && adminsExists) {
      try {
        const [roleCount] = await sequelize.query(`
          SELECT COUNT(*) as count FROM admin_roles WHERE name = 'Super Admin'
        `, { type: sequelize.QueryTypes.SELECT });
        
        if (roleCount.count === 0) {
          console.log('👑 Creating default Super Admin role...');
          await sequelize.query(`
            INSERT INTO admin_roles (id, name, description, permissions, "isSystemRole", "isActive", priority, "createdAt", "updatedAt")
            VALUES (
              gen_random_uuid(),
              'Super Admin',
              'Full system access with all permissions',
              '{"dashboard":{"read":true,"write":true},"users":{"read":true,"write":true,"delete":true},"calls":{"read":true,"write":true,"delete":true},"billing":{"read":true,"write":true},"analytics":{"read":true,"write":true},"settings":{"read":true,"write":true},"admins":{"read":true,"write":true,"delete":true},"logs":{"read":true},"system":{"read":true,"write":true}}',
              true,
              true,
              100,
              NOW(),
              NOW()
            )
            ON CONFLICT (name) DO NOTHING
          `);
        }
      } catch (error) {
        console.warn('⚠️ Could not verify/create Super Admin role:', error.message);
      }
    }
    
    console.log('✅ Foreign key constraints check completed');
  } catch (error) {
    console.error('❌ Foreign key constraints check error:', error.message);
    console.warn('⚠️ Some database constraints may not be properly configured');
    console.warn('⚠️ Please run migrations to fix database structure');
    
    // 在生产环境中，如果数据库结构有问题，我们应该让启动失败
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    console.warn('⚠️ Continuing in development mode despite constraint errors');
  }
};

// Note: Admin model relationships are defined in ./Admin.js

// 导出所有模型
module.exports = {
  // 现有模型
  User,
  Call,
  IncomingCall,
  CallRecording,
  Payment,
  UserPhoneNumber,
  Contact, // 添加 Contact 模型导出
  
  // Admin models (imported from ./Admin.js)
  Admin,
  AdminRole,
  AdminSession,
  AdminAuditLog,
  
  // 数据库连接和工具函数
  sequelize,
  addForeignKeyConstraints,
  performDatabaseHealthCheck
}; 