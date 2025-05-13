const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No authentication token, access denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user with the ID from the token
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    // Add user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

/**
 * Optional authentication middleware
 * Will attach user to request if token is valid, but won't block request if no token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user with the ID from the token
      const user = await User.findById(decoded.userId);
      
      if (user) {
        // Add user to request
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Just proceed without authentication
    next();
  }
};

module.exports = {
  auth,
  optionalAuth
};