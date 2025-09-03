const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if googleId is not provided
      return !this.googleId;
    },
    minlength: 6
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Fields for password reset
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // Fields for Google OAuth
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  profilePicture: {
    type: String
  }
}, {
  timestamps: true
});

// Index for email lookup
userSchema.index({ email: 1 });
// Index for Google ID lookup
userSchema.index({ googleId: 1 });

module.exports = mongoose.model('User', userSchema); 