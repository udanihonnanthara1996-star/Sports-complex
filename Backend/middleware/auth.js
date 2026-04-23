const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({
        message: 'Authentication Required: You must be logged in.',
      });
    }

    // Check if token starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'Authentication Required: Token format invalid' });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      return res.status(401).json({
        message: 'Authentication Required: You must be logged in.',
      });
    }

    // Verify the JWT token
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'sports_complex_jwt_secret_key'
      );
      req.user = decoded;
      next();
    } catch (jwtError) {
      return res
        .status(401)
        .json({ message: 'Authentication Required: Token is not valid or expired' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error in authentication' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

module.exports = auth;
module.exports.adminOnly = adminOnly;
