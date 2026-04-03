const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication Required: You must be logged in to submit a ticket.' });
    }
    
    // Check if token starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication Required: Token format invalid' });
    }
    
    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication Required: You must be logged in to submit a ticket.' });
    }
    
    // Verify the JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sports_complex_jwt_secret_key_2025');
      req.user = decoded;
      next();
    } catch (jwtError) {
      return res.status(401).json({ message: 'Authentication Required: Token is not valid or expired' });
    }
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

module.exports = auth;
