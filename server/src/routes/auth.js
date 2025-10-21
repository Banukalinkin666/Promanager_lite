import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = Router();

router.post(
  '/login',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    
    // Check if user account is active
    if (user.isActive === false) {
      return res.status(403).json({ 
        message: 'Your account has been deactivated. Please contact the administrator for assistance.',
        reason: 'ACCOUNT_INACTIVE'
      });
    }
    
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '12h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  }
);

export default router;


