const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Phone Number Pool Model (for admin management)
const PhoneNumber = sequelize.define('PhoneNumber', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  number: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      name: 'phone_numbers_pool_number_unique',
      msg: 'This phone number already exists'
    },
    comment: 'Phone number in E.164 format'
  },
  friendlyName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Human-readable name for the phone number'
  },
  type: {
    type: DataTypes.ENUM('local', 'toll-free', 'mobile'),
    allowNull: false,
    defaultValue: 'local'
  },
  status: {
    type: DataTypes.ENUM('available', 'assigned', 'reserved', 'blocked'),
    allowNull: false,
    defaultValue: 'available'
  },
  country: {
    type: DataTypes.STRING(2),
    allowNull: false,
    comment: 'ISO country code (US, CA, UK, etc.)'
  },
  region: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'State/Province/Region'
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'City or locality'
  },
  // Pricing information
  monthlyPrice: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 1.0000,
    comment: 'Monthly rental fee'
  },
  setupFee: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0.0000,
    comment: 'One-time setup fee'
  },
  // Capabilities
  capabilities: {
    type: DataTypes.JSONB,
    defaultValue: {
      voice: true,
      sms: false,
      mms: false,
      fax: false
    }
  },
  // Provider information
  providerId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Provider-specific identifier (Twilio SID, etc.)'
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'twilio',
    comment: 'Service provider (twilio, vonage, etc.)'
  },
  // Metadata
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'phone_numbers_pool',
  indexes: [
    {
      fields: ['status'],
      name: 'phone_numbers_pool_status_idx'
    },
    {
      fields: ['type'],
      name: 'phone_numbers_pool_type_idx'
    },
    {
      fields: ['country'],
      name: 'phone_numbers_pool_country_idx'
    }
  ]
});

module.exports = PhoneNumber;