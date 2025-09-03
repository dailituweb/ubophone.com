const jwt = require('jsonwebtoken');

// 确保JWT_SECRET环境变量存在
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  process.exit(1);
}

module.exports = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token with strict secret validation
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'], // 仅允许HMAC SHA256算法
      issuer: process.env.JWT_ISSUER || 'ubophone-api',
      maxAge: process.env.JWT_EXPIRES_IN || '24h'
    });
    
    req.user = { 
      userId: decoded.userId,
      iat: decoded.iat,
      exp: decoded.exp
    };
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token has expired', code: 'TOKEN_EXPIRED' });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Token is invalid', code: 'TOKEN_INVALID' });
    } else {
      res.status(401).json({ message: 'Token is not valid', code: 'TOKEN_ERROR' });
    }
  }
}; 