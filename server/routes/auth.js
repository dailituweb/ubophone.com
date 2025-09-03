const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto-js');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const auth = require('../middleware/auth');
const passport = require('../config/passport');
const { sendEmail } = require('../config/email');

const router = express.Router();

// 输入验证中间件
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Register
router.post('/register', validateRegistration, async (req, res) => {
  try {
    // 检查验证错误
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, email, password } = req.body;

    // Check if user exists
    let existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12); // 增强盐轮数
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username: username || email.split('@')[0],
      email,
      password: hashedPassword,
      balance: 0.00 // No welcome credits
    });

    // Create token with strict configuration
    const payload = { 
      userId: user.id,
      iss: process.env.JWT_ISSUER || 'ubophone-api',
      aud: 'ubophone-users'
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      algorithm: 'HS256'
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    // 检查验证错误
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    console.log(`🔐 Login attempt for email: ${email}`);

    // Check user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`❌ Email not found: ${email}`);
      return res.status(400).json({ message: 'Email is incorrect' });
    }

    console.log(`✅ User found: ${user.username} (${user.email})`);

    // Check if user has password (might be Google OAuth user)
    if (!user.password) {
      console.log(`🔗 Google OAuth user attempted password login: ${email}`);
      return res.status(400).json({ 
        message: 'This account uses Google login. Please sign in with Google.' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`❌ Wrong password for user: ${email}`);
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    console.log(`✅ Successful login: ${user.username} (${user.email})`);

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Create token with strict configuration
    const payload = { 
      userId: user.id,
      iss: process.env.JWT_ISSUER || 'ubophone-api',
      aud: 'ubophone-users'
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      algorithm: 'HS256'
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password - Request reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal that the user doesn't exist
      return res.json({ message: 'If your email is registered, you will receive a password reset link' });
    }

    // Generate reset token
    const resetToken = crypto.lib.WordArray.random(20).toString();
    
    // Hash token before saving to database
    const resetPasswordToken = crypto.SHA256(resetToken).toString();
    
    // Set token expiry (1 hour from now)
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    
    // Save to user
    await user.update({
      resetPasswordToken,
      resetPasswordExpires
    });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    // Send email
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `You are receiving this because you (or someone else) requested a password reset for your account.\n\n
        Please click on the following link, or paste it into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      html: `
        <h1>Password Reset</h1>
        <p>You are receiving this because you (or someone else) requested a password reset for your account.</p>
        <p>Please click on the following link, or paste it into your browser to complete the process:</p>
        <a href="${resetUrl}" target="_blank">Reset Password</a>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      `
    });

    res.json({ 
      message: 'If your email is registered, you will receive a password reset link',
      success: true,
      demo: emailResult.demo || false,
      previewUrl: emailResult.previewUrl || null
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password - Validate token and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Hash the token from the URL
    const resetPasswordToken = crypto.SHA256(token).toString();
    
    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
      }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });
    
    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Your password has been changed',
      text: `This is a confirmation that the password for your account ${user.email} has just been changed.\n`,
      html: `
        <h1>Password Changed</h1>
        <p>This is a confirmation that the password for your account ${user.email} has just been changed.</p>
      `
    });
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth routes
// Initiate Google OAuth login
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/login?error=google-auth-failed' 
  }),
  (req, res) => {
    try {
      // Create token with strict configuration
      const payload = { 
        userId: req.user.id,
        iss: process.env.JWT_ISSUER || 'ubophone-api',
        aud: 'ubophone-users'
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        algorithm: 'HS256'
      });
      
      // Redirect with token (to be handled by frontend)
      res.redirect(`/auth/social-callback?token=${token}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('/login?error=server-error');
    }
  }
);

module.exports = router; 