import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// In-memory cache to avoid repeated DB lookups for the mock admin
let _cachedMockUser = null;

export const protect = async (req, res, next) => {
  let token;

  // 1. Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    // Verify the JWT and load the real user
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Token invalid or expired' });
    }
  }

  // 2. Demo fallback — use or create a persistent admin user
  try {
    if (_cachedMockUser) {
      req.user = _cachedMockUser;
      return next();
    }

    let user = await User.findOne({ email: 'admin@xeno.ai' });
    if (!user) {
      user = await User.create({
        name: 'Admin User',
        email: 'admin@xeno.ai',
        password: 'XenoAdmin@2025!',
        role: 'Admin',
      });
    }
    _cachedMockUser = user;
    req.user = user;
    next();
  } catch (error) {
    // Race condition: try one more find
    try {
      const user = await User.findOne({ email: 'admin@xeno.ai' });
      if (user) {
        _cachedMockUser = user;
        req.user = user;
        return next();
      }
    } catch (_) {}
    console.error('Auth middleware error:', error.message);
    next(new Error('Authentication failed'));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`User role ${req.user.role} is not authorized`));
    }
    next();
  };
};
