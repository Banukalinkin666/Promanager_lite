import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

// Create tenant account (OWNER, ADMIN)
router.post('/', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { 
      firstName, lastName, middleName, passportNo, nic, nicExpirationDate,
      primaryEmail, phone, nationality, secondaryEmail, secondaryPhone,
      emergencyContact, address, employment, notes, status, password
    } = req.body;

    // Check if email already exists
    const exists = await User.findOne({ email: primaryEmail });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    // Create password hash
    const passwordHash = await User.hashPassword(password || 'tenant123');

    // Create tenant with all details
    const tenant = await User.create({
      name: `${firstName} ${lastName}`.trim(),
      email: primaryEmail,
      passwordHash,
      role: 'TENANT',
      firstName,
      lastName,
      middleName,
      passportNo,
      nic,
      nicExpirationDate: nicExpirationDate ? new Date(nicExpirationDate) : undefined,
      primaryEmail,
      phone,
      nationality,
      secondaryEmail,
      secondaryPhone,
      emergencyContact,
      address,
      employment,
      notes,
      status: status || 'ACTIVE'
    });

    res.status(201).json({ 
      id: tenant._id, 
      name: tenant.name, 
      email: tenant.email, 
      role: tenant.role,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      phone: tenant.phone,
      nic: tenant.nic,
      status: tenant.status
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ message: 'Error creating tenant', error: error.message });
  }
});

// List tenants (ADMIN: all, OWNER: all tenants)
router.get('/', authenticate, authorize('OWNER', 'ADMIN'), async (_req, res) => {
  try {
    const tenants = await User.find({ role: 'TENANT' }).select('-passwordHash');
    res.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ message: 'Error fetching tenants', error: error.message });
  }
});

// Get all users (ADMIN only) - MUST be before /:id route
router.get('/all', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash');
    res.json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get specific tenant (OWNER, ADMIN)
router.get('/:id', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const tenant = await User.findOne({ _id: req.params.id, role: 'TENANT' }).select('-passwordHash');
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ message: 'Error fetching tenant', error: error.message });
  }
});

// Update tenant (OWNER, ADMIN)
router.put('/:id', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { 
      firstName, lastName, middleName, passportNo, nic, nicExpirationDate,
      primaryEmail, phone, nationality, secondaryEmail, secondaryPhone,
      emergencyContact, address, employment, notes, status
    } = req.body;

    // Check if tenant exists
    const existingTenant = await User.findOne({ _id: req.params.id, role: 'TENANT' });
    if (!existingTenant) return res.status(404).json({ message: 'Tenant not found' });

    // Check if email is being changed and if new email already exists
    if (primaryEmail && primaryEmail !== existingTenant.email) {
      const emailExists = await User.findOne({ email: primaryEmail, _id: { $ne: req.params.id } });
      if (emailExists) return res.status(400).json({ message: 'Email already exists' });
    }

    // Update tenant
    const updatedTenant = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: `${firstName} ${lastName}`.trim(),
        email: primaryEmail || existingTenant.email,
        firstName,
        lastName,
        middleName,
        passportNo,
        nic,
        nicExpirationDate: nicExpirationDate ? new Date(nicExpirationDate) : undefined,
        primaryEmail,
        phone,
        nationality,
        secondaryEmail,
        secondaryPhone,
        emergencyContact,
        address,
        employment,
        notes,
        status: status || existingTenant.status
      },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json(updatedTenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ message: 'Error updating tenant', error: error.message });
  }
});

// Delete tenant (OWNER, ADMIN)
router.delete('/:id', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const tenant = await User.findOne({ _id: req.params.id, role: 'TENANT' });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    // Check if tenant is currently occupying any units
    const Property = (await import('../models/Property.js')).default;
    const propertiesWithTenant = await Property.find({ 'units.tenant': req.params.id });
    
    if (propertiesWithTenant.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete tenant who is currently occupying units. Please move them out first.' 
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ message: 'Error deleting tenant', error: error.message });
  }
});

// Tenant self profile
router.get('/me', authenticate, authorize('TENANT'), async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select('-passwordHash');
    res.json(me);
  } catch (error) {
    console.error('Error fetching tenant profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update tenant profile (TENANT - own profile only)
router.put('/me', authenticate, authorize('TENANT'), async (req, res) => {
  try {
    const { 
      firstName, lastName, middleName, primaryEmail, phone, nationality, 
      secondaryEmail, secondaryPhone, emergencyContact, address
    } = req.body;

    // Check if tenant exists
    const existingTenant = await User.findOne({ _id: req.user.id, role: 'TENANT' });
    if (!existingTenant) return res.status(404).json({ message: 'Tenant not found' });

    // Check if email is being changed and if it's already taken
    if (primaryEmail && primaryEmail !== existingTenant.primaryEmail) {
      const emailExists = await User.findOne({ 
        primaryEmail: primaryEmail, 
        _id: { $ne: req.user.id } 
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update tenant profile
    const updatedTenant = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName: firstName || existingTenant.firstName,
        lastName: lastName || existingTenant.lastName,
        middleName: middleName || existingTenant.middleName,
        primaryEmail: primaryEmail || existingTenant.primaryEmail,
        phone: phone || existingTenant.phone,
        nationality: nationality || existingTenant.nationality,
        secondaryEmail: secondaryEmail || existingTenant.secondaryEmail,
        secondaryPhone: secondaryPhone || existingTenant.secondaryPhone,
        emergencyContact: emergencyContact || existingTenant.emergencyContact,
        address: address || existingTenant.address,
        // Update name field for display
        name: `${firstName || existingTenant.firstName} ${lastName || existingTenant.lastName}`.trim(),
        // Update email field for login
        email: primaryEmail || existingTenant.primaryEmail
      },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json(updatedTenant);
  } catch (error) {
    console.error('Error updating tenant profile:', error);
    res.status(500).json({ message: 'Error updating tenant profile', error: error.message });
  }
});

// Update user credentials (ADMIN only)
router.put('/:userId/credentials', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, phone, role, isActive } = req.body;
    
    const updateData = { firstName, lastName, email, phone, role, isActive };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user credentials:', error);
    res.status(500).json({ message: 'Error updating user credentials', error: error.message });
  }
});

// Reset user password (ADMIN only)
router.put('/:userId/reset-password', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash the new password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    user.passwordHash = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// Toggle user active status (ADMIN only)
router.put('/:userId/toggle-status', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admin from deactivating themselves
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive 
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
});

export default router;


