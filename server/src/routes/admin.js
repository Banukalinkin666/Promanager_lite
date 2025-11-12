import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Lease from '../models/Lease.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';

const router = Router();

// All routes require super admin authentication
router.use(authenticate);
router.use(requireSuperAdmin);

// ==================== USERS MANAGEMENT ====================

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash').lean();
    res.json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    if (password) {
      userData.passwordHash = await User.hashPassword(password);
    }
    const user = await User.create(userData);
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.status(201).json(userObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    if (password) {
      updateData.passwordHash = await User.hashPassword(password);
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully', user: { id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROPERTIES MANAGEMENT ====================

// Get all properties
router.get('/properties', async (req, res) => {
  try {
    const properties = await Property.find({})
      .populate('owner', 'name email')
      .lean();
    res.json({ count: properties.length, properties });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single property
router.get('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email')
      .lean();
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create property
router.post('/properties', async (req, res) => {
  try {
    const property = await Property.create(req.body);
    await property.populate('owner', 'name email');
    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update property
router.put('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete property
router.delete('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ message: 'Property deleted successfully', property: { id: property._id, title: property.title } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== UNITS MANAGEMENT ====================

// Get all units (across all properties)
router.get('/units', async (req, res) => {
  try {
    const properties = await Property.find({}).select('title address units').lean();
    const allUnits = [];
    properties.forEach(property => {
      property.units.forEach(unit => {
        allUnits.push({
          ...unit,
          propertyId: property._id,
          propertyTitle: property.title,
          propertyAddress: property.address
        });
      });
    });
    res.json({ count: allUnits.length, units: allUnits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update unit
router.put('/properties/:propertyId/units/:unitId', async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    
    const unit = property.units.id(req.params.unitId);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    
    Object.assign(unit, req.body);
    await property.save();
    
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete unit
router.delete('/properties/:propertyId/units/:unitId', async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    
    const unit = property.units.id(req.params.unitId);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    
    unit.remove();
    await property.save();
    
    res.json({ message: 'Unit deleted successfully', unit: { id: unit._id, name: unit.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LEASES MANAGEMENT ====================

// Get all leases
router.get('/leases', async (req, res) => {
  try {
    const leases = await Lease.find({})
      .populate('property', 'title address')
      .populate('tenant', 'name email phone')
      .populate('owner', 'name email')
      .lean();
    res.json({ count: leases.length, leases });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single lease
router.get('/leases/:id', async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('property', 'title address')
      .populate('tenant', 'name email phone')
      .populate('owner', 'name email')
      .lean();
    if (!lease) return res.status(404).json({ error: 'Lease not found' });
    res.json(lease);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create lease
router.post('/leases', async (req, res) => {
  try {
    const lease = await Lease.create(req.body);
    await lease.populate([
      { path: 'property', select: 'title address' },
      { path: 'tenant', select: 'name email phone' },
      { path: 'owner', select: 'name email' }
    ]);
    res.status(201).json(lease);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lease
router.put('/leases/:id', async (req, res) => {
  try {
    const lease = await Lease.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'property', select: 'title address' },
      { path: 'tenant', select: 'name email phone' },
      { path: 'owner', select: 'name email' }
    ]);
    if (!lease) return res.status(404).json({ error: 'Lease not found' });
    res.json(lease);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete lease
router.delete('/leases/:id', async (req, res) => {
  try {
    const lease = await Lease.findByIdAndDelete(req.params.id);
    if (!lease) return res.status(404).json({ error: 'Lease not found' });
    res.json({ message: 'Lease deleted successfully', lease: { id: lease._id, agreementNumber: lease.agreementNumber } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PAYMENTS MANAGEMENT ====================

// Get all payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('tenant', 'name email phone')
      .populate('invoice')
      .lean();
    res.json({ count: payments.length, payments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single payment
router.get('/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('tenant', 'name email phone')
      .populate('invoice')
      .lean();
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create payment
router.post('/payments', async (req, res) => {
  try {
    const payment = await Payment.create(req.body);
    await payment.populate('tenant', 'name email phone');
    await payment.populate('invoice');
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment
router.put('/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('tenant', 'name email phone').populate('invoice');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete payment
router.delete('/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted successfully', payment: { id: payment._id, amount: payment.amount } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INVOICES MANAGEMENT ====================

// Get all invoices
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find({})
      .populate('property', 'title address')
      .populate('tenant', 'name email phone')
      .populate('payment')
      .lean();
    res.json({ count: invoices.length, invoices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single invoice
router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('property', 'title address')
      .populate('tenant', 'name email phone')
      .populate('payment')
      .lean();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice
router.post('/invoices', async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);
    await invoice.populate([
      { path: 'property', select: 'title address' },
      { path: 'tenant', select: 'name email phone' },
      { path: 'payment' }
    ]);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update invoice
router.put('/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'property', select: 'title address' },
      { path: 'tenant', select: 'name email phone' },
      { path: 'payment' }
    ]);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete invoice
router.delete('/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully', invoice: { id: invoice._id, amount: invoice.amount } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATISTICS ====================

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const [users, properties, leases, payments, invoices] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Lease.countDocuments(),
      Payment.countDocuments(),
      Invoice.countDocuments()
    ]);

    const totalUnits = await Property.aggregate([
      { $project: { unitCount: { $size: '$units' } } },
      { $group: { _id: null, total: { $sum: '$unitCount' } } }
    ]);

    res.json({
      users: {
        total: users,
        byRole: {
          superAdmin: await User.countDocuments({ role: 'SUPER_ADMIN' }),
          admin: await User.countDocuments({ role: 'ADMIN' }),
          owner: await User.countDocuments({ role: 'OWNER' }),
          tenant: await User.countDocuments({ role: 'TENANT' })
        }
      },
      properties: properties,
      units: totalUnits[0]?.total || 0,
      leases: leases,
      payments: payments,
      invoices: invoices
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

