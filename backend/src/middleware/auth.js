import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Cached mock user to avoid a DB hit on every request
let _cachedMockUser = null;

export const protect = async (req, res, next) => {
  // Demo Mode: Bypass JWT Auth and inject a persisted mock user
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
        password: 'XenoAdmin@2025!', // hashed by pre-save hook
        role: 'Admin',
      });
    }
    _cachedMockUser = user;
    req.user = user;
    next();
  } catch (error) {
    // If user creation fails (e.g. race condition duplicate), try findOne again
    try {
      const user = await User.findOne({ email: 'admin@xeno.ai' });
      if (user) {
        _cachedMockUser = user;
        req.user = user;
        return next();
      }
    } catch (_) {}
    console.error('Auth middleware error:', error.message);
    next(new Error('Auth setup failed'));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`User role ${req.user.role} is not authorized to access this route`));
    }
    next();
  };
};
