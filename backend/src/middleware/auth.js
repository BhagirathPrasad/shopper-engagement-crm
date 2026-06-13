import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  // Mini CRM Mode: Bypass JWT Auth and inject a mock user
  try {
    let user = await User.findOne({ email: 'admin@xeno.ai' });
    if (!user) {
      // Create fallback dummy user if missing
      user = await User.create({
        name: 'Admin User',
        email: 'admin@xeno.ai',
        password: 'dummy_password', // Doesn't matter, auth is bypassed
        role: 'admin'
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in mock auth:', error);
    next(new Error('Auth bypass failed'));
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
