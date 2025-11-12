import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || req.cookies.token;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.id).select('isActive role email name');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if user account is active
    if (user.isActive === false) {
      return res.status(403).json({ 
        message: 'Your account has been deactivated. Please contact the administrator.',
        reason: 'ACCOUNT_INACTIVE'
      });
    }
    
    // Update req.user with current user data (including role from database)
    req.user = { id: decoded.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    // SUPER_ADMIN bypasses all role restrictions
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

// Middleware to check if user is super admin
export function requireSuperAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
}


