import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import upload, { USE_CLOUD_STORAGE } from '../middleware/cloudUpload.js';
import Property from '../models/Property.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Upload property images (OWNER, ADMIN)
router.post('/upload-images', authenticate, authorize('OWNER', 'ADMIN'), (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 5MB per file.' });
      }
      if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({ message: 'Only image files are allowed!' });
      }
      return res.status(500).json({ message: 'Error uploading images', error: err.message });
    }
    
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No images uploaded' });
      }

      // Handle URLs differently for cloud vs local storage
      const imageUrls = req.files.map(file => {
        if (USE_CLOUD_STORAGE && file.path && file.path.startsWith('http')) {
          // Cloudinary returns full URL in file.path
          console.log('Cloudinary upload - Full URL:', file.path);
          return file.path;
        } else {
          // Local storage - extract just the filename and create relative path
          const filename = file.filename || path.basename(file.path);
          const relativeUrl = `/uploads/properties/${filename}`;
          console.log('Local upload - File:', { 
            originalPath: file.path, 
            filename: filename,
            relativeUrl: relativeUrl 
          });
          return relativeUrl;
        }
      });
      
      console.log('📤 Images uploaded successfully:', imageUrls);
      res.json({ imageUrls });
    } catch (error) {
      console.error('Error processing uploaded images:', error);
      res.status(500).json({ message: 'Error processing images', error: error.message });
    }
  });
});

// Create property (OWNER, ADMIN)
router.post('/', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const ownerId = req.user.role === 'OWNER' ? req.user.id : req.body.owner || req.user.id;
    const property = await Property.create({ ...req.body, owner: ownerId });
    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ message: 'Error creating property', error: error.message });
  }
});

// Get dashboard statistics (OWNER, ADMIN)
router.get('/stats', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const filter = req.user.role === 'OWNER' ? { owner: req.user.id } : {};
    const properties = await Property.find(filter);
    
    let totalProperties = properties.length;
    let totalUnits = 0;
    let vacantUnits = 0;
    let occupiedUnits = 0;
    let maintenanceUnits = 0;
    
    const propertyStats = properties.map(property => {
      const units = property.units || [];
      const propertyVacant = units.filter(unit => unit.status === 'AVAILABLE').length;
      const propertyOccupied = units.filter(unit => unit.status === 'OCCUPIED').length;
      const propertyMaintenance = units.filter(unit => unit.status === 'MAINTENANCE').length;
      
      totalUnits += units.length;
      vacantUnits += propertyVacant;
      occupiedUnits += propertyOccupied;
      maintenanceUnits += propertyMaintenance;
      
      return {
        propertyId: property._id,
        propertyName: property.title,
        propertyAddress: property.address,
        totalUnits: units.length,
        vacant: propertyVacant,
        occupied: propertyOccupied,
        maintenance: propertyMaintenance
      };
    });
    
    res.json({
      totalProperties,
      totalUnits,
      vacantUnits,
      occupiedUnits,
      maintenanceUnits,
      propertyStats
    });
  } catch (error) {
    console.error('Error fetching property stats:', error);
    res.status(500).json({ message: 'Error fetching property statistics', error: error.message });
  }
});

// Debug endpoint to check rent calculation for specific unit
router.get('/debug-rent/:unitId', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { unitId } = req.params;
    console.log('🔍 Debugging rent for unit:', unitId);
    
    // Import Payment model
    const Payment = (await import('../models/Payment.js')).default;
    
    // Get all payments for this specific unit
    const payments = await Payment.find({
      'metadata.unitId': unitId
    });
    
    console.log('📊 Found payments for unit:', payments.length);
    console.log('📊 Payment details:', payments.map(p => ({
      id: p._id,
      amount: p.amount,
      status: p.status,
      propertyId: p.metadata?.propertyId,
      unitId: p.metadata?.unitId,
      originalAmount: p.metadata?.originalAmount,
      month: p.metadata?.month,
      dueDate: p.metadata?.dueDate
    })));
    
    // Calculate totals
    let totalPaid = 0;
    let totalPending = 0;
    let totalDue = 0;
    const today = new Date();
    
    payments.forEach(payment => {
      const originalAmount = payment.metadata?.originalAmount || payment.amount;
      const dueDate = new Date(payment.metadata?.dueDate || payment.createdAt);
      
      if (payment.status === 'SUCCEEDED') {
        totalPaid += originalAmount;
      } else if (today > dueDate) {
        totalDue += originalAmount;
      } else {
        totalPending += originalAmount;
      }
    });
    
    res.json({
      unitId,
      totalPayments: payments.length,
      totalPaid,
      totalPending,
      totalDue,
      payments: payments.map(p => ({
        id: p._id,
        amount: p.amount,
        status: p.status,
        originalAmount: p.metadata?.originalAmount,
        month: p.metadata?.month,
        dueDate: p.metadata?.dueDate
      }))
    });
  } catch (error) {
    console.error('Error debugging rent:', error);
    res.status(500).json({ message: 'Error debugging rent', error: error.message });
  }
});

// Get tenant and rent statistics (OWNER, ADMIN)
router.get('/tenant-rent-stats', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const filter = req.user.role === 'OWNER' ? { owner: req.user.id } : {};
    const properties = await Property.find(filter).populate('units.tenant', 'name firstName lastName email phone');
    
    // Import Payment model
    const Payment = (await import('../models/Payment.js')).default;
    
    // Get all payments for these properties
    const propertyIds = properties.map(p => p._id);
    console.log('🔍 Looking for payments with propertyIds:', propertyIds);
    
    // Try multiple query approaches to find payments
    const payments1 = await Payment.find({
      'metadata.propertyId': { $in: propertyIds }
    });
    
    const payments2 = await Payment.find({
      'metadata.propertyId': { $in: propertyIds.map(id => id.toString()) }
    });
    
    const payments3 = await Payment.find({
      'metadata.propertyId': { $in: propertyIds.map(id => new mongoose.Types.ObjectId(id)) }
    });
    
    // Also try to find payments by unit IDs
    const allUnitIds = [];
    properties.forEach(property => {
      property.units.forEach(unit => {
        allUnitIds.push(unit._id);
      });
    });
    
    const payments4 = await Payment.find({
      'metadata.unitId': { $in: allUnitIds }
    });
    
    console.log('📊 Query 1 (propertyId as ObjectId):', payments1.length);
    console.log('📊 Query 2 (propertyId as string):', payments2.length);
    console.log('📊 Query 3 (propertyId as new ObjectId):', payments3.length);
    console.log('📊 Query 4 (unitId):', payments4.length);
    
    // Use the query that returns the most results
    const payments = payments1.length > payments2.length ? payments1 : payments2;
    const finalPayments = payments.length > payments3.length ? payments : payments3;
    const allPayments = finalPayments.length > payments4.length ? finalPayments : payments4;
    
    console.log('📊 Found payments:', allPayments.length);
    console.log('📊 Payment details:', allPayments.map(p => ({
      id: p._id,
      amount: p.amount,
      status: p.status,
      propertyId: p.metadata?.propertyId,
      unitId: p.metadata?.unitId,
      originalAmount: p.metadata?.originalAmount
    })));
    
    // Calculate tenant statistics
    const activeTenants = new Set();
    const propertyTenantStats = [];
    let totalDueRent = 0;
    let totalPendingRent = 0;
    let totalPaidRent = 0;
    
    properties.forEach(property => {
      const units = property.units || [];
      const occupiedUnits = units.filter(unit => unit.status === 'OCCUPIED' && unit.tenant);
      
      // Count unique active tenants
      occupiedUnits.forEach(unit => {
        if (unit.tenant) {
          activeTenants.add(unit.tenant._id.toString());
        }
      });
      
      // Calculate rent statistics for this property
      const propertyPayments = allPayments.filter(payment => {
        const paymentPropertyId = payment.metadata?.propertyId?.toString();
        const paymentUnitId = payment.metadata?.unitId?.toString();
        const currentPropertyId = property._id.toString();
        
        // Check if payment belongs to this property either directly or through its units
        const belongsToProperty = paymentPropertyId === currentPropertyId;
        const belongsToUnit = property.units.some(unit => unit._id.toString() === paymentUnitId);
        
        return belongsToProperty || belongsToUnit;
      });
      
      console.log(`🏠 Property ${property.title} (${property._id}):`);
      console.log(`   📊 Found ${propertyPayments.length} payments for this property`);
      
      // Calculate rent status using the new logic
      const today = new Date();
      const rentStatusBreakdown = {
        pending: 0,
        due: 0,
        paid: 0
      };
      
      propertyPayments.forEach(payment => {
        const paymentStatus = payment.status;
        const rentDueDate = new Date(payment.metadata?.dueDate || payment.createdAt);
        
        // Get the original amount (before advance payment deduction)
        const originalAmount = payment.metadata?.originalAmount || payment.amount;
        
        console.log(`   💰 Payment ${payment._id}: status=${paymentStatus}, amount=${payment.amount}, originalAmount=${originalAmount}, dueDate=${rentDueDate.toISOString()}`);
        
        if (paymentStatus === 'SUCCEEDED') {
          // For succeeded payments, use the original amount to reflect the full rent value
          // This includes payments covered by advance payment (amount=0 but status=SUCCEEDED)
          rentStatusBreakdown.paid += originalAmount;
          console.log(`     ✅ Added to paid: ${originalAmount} (payment amount: ${payment.amount})`);
        } else {
          if (today > rentDueDate) {
            rentStatusBreakdown.due += originalAmount;
            console.log(`     ⚠️ Added to due: ${originalAmount}`);
          } else {
            rentStatusBreakdown.pending += originalAmount;
            console.log(`     ⏳ Added to pending: ${originalAmount}`);
          }
        }
      });
      
      console.log(`   📈 Final breakdown for ${property.title}:`, rentStatusBreakdown);
      
      const propertyPendingRent = rentStatusBreakdown.pending;
      const propertyDueRent = rentStatusBreakdown.due;
      const propertyPaidRent = rentStatusBreakdown.paid;
      
      totalDueRent += propertyDueRent;
      totalPendingRent += propertyPendingRent;
      totalPaidRent += propertyPaidRent;
      
      propertyTenantStats.push({
        propertyId: property._id,
        propertyName: property.title,
        propertyAddress: property.address,
        activeTenants: occupiedUnits.length,
        totalUnits: units.length,
        pendingRent: propertyPendingRent,
        dueRent: propertyDueRent,
        paidRent: propertyPaidRent,
        rentStatusBreakdown: rentStatusBreakdown,
        tenantDetails: occupiedUnits.map(unit => ({
          tenantId: unit.tenant._id,
          tenantName: unit.tenant.name || `${unit.tenant.firstName || ''} ${unit.tenant.lastName || ''}`.trim(),
          unitName: unit.name,
          unitRent: unit.rentAmount
        }))
      });
    });
    
    res.json({
      totalActiveTenants: activeTenants.size,
      totalDueRent,
      totalPendingRent,
      totalPaidRent,
      propertyTenantStats
    });
  } catch (error) {
    console.error('Error fetching tenant and rent stats:', error);
    res.status(500).json({ message: 'Error fetching tenant and rent statistics', error: error.message });
  }
});

// List properties (OWNER sees own, ADMIN sees all, TENANT sees all to find their unit)
router.get('/', authenticate, authorize('OWNER', 'ADMIN', 'TENANT'), async (req, res) => {
  const filter = req.user.role === 'OWNER' ? { owner: req.user.id } : {};
  const props = await Property.find(filter).populate('units.tenant', 'name email phone');
  res.json(props);
});

// Get one
router.get('/:id', authenticate, authorize('OWNER', 'ADMIN', 'TENANT'), async (req, res) => {
  const property = await Property.findById(req.params.id).populate('units.tenant', 'name email phone');
  if (!property) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'OWNER' && String(property.owner) !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(property);
});

// Update
router.put('/:id', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'OWNER' && String(property.owner) !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Preserve existing units if not provided in update
    const updateData = { ...req.body };
    if (!updateData.units && property.units && property.units.length > 0) {
      updateData.units = property.units;
    }
    
    Object.assign(property, updateData);
    await property.save();
    
    // Return property with populated tenant data
    const updatedProperty = await Property.findById(req.params.id).populate('units.tenant', 'name email phone');
    res.json(updatedProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ message: 'Error updating property', error: error.message });
  }
});

// Delete
router.delete('/:id', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    
    if (req.user.role === 'OWNER' && String(property.owner) !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Import required models for validation
    const Payment = (await import('../models/Payment.js')).default;
    const Lease = (await import('../models/Lease.js')).default;
    const Invoice = (await import('../models/Invoice.js')).default;

    // Check for active leases
    const activeLeases = await Lease.find({ 
      property: req.params.id, 
      status: 'ACTIVE' 
    });
    
    if (activeLeases.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete property. There are ${activeLeases.length} active lease(s) associated with this property. Please end all leases before deleting.`,
        details: {
          activeLeases: activeLeases.length,
          leaseIds: activeLeases.map(l => l._id)
        }
      });
    }

    // Check for payment records
    const payments = await Payment.find({ 
      'metadata.propertyId': req.params.id 
    });
    
    if (payments.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete property. There are ${payments.length} payment record(s) associated with this property. Please contact administrator to handle payment history before deleting.`,
        details: {
          totalPayments: payments.length,
          paidPayments: payments.filter(p => p.status === 'SUCCEEDED').length,
          pendingPayments: payments.filter(p => p.status === 'PENDING').length
        }
      });
    }

    // Check for invoices
    const invoices = await Invoice.find({ property: req.params.id });
    
    if (invoices.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete property. There are ${invoices.length} invoice(s) associated with this property. Please resolve all invoices before deleting.`,
        details: {
          totalInvoices: invoices.length
        }
      });
    }

    // Check for occupied units
    const occupiedUnits = property.units?.filter(unit => unit.status === 'OCCUPIED' && unit.tenant) || [];
    
    if (occupiedUnits.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete property. There are ${occupiedUnits.length} occupied unit(s). Please move out all tenants before deleting.`,
        details: {
          occupiedUnits: occupiedUnits.length,
          unitNames: occupiedUnits.map(u => u.name)
        }
      });
    }

    // If all checks pass, delete the property
    await property.deleteOne();
    
    res.json({ 
      ok: true, 
      message: 'Property deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ 
      message: 'Error deleting property', 
      error: error.message 
    });
  }
});

// Add unit to property (OWNER/ADMIN)
router.post('/:id/units', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'OWNER' && String(property.owner) !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  property.units.push(req.body);
  await property.save();
  res.json(property);
});

// Update unit status (OWNER/ADMIN)
router.put('/:id/units/:unitId', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'OWNER' && String(property.owner) !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const unit = property.units.id(req.params.unitId);
  if (!unit) return res.status(404).json({ message: 'Unit not found' });
  Object.assign(unit, req.body);
  await property.save();
  res.json(property);
});

// Delete unit (OWNER/ADMIN)
router.delete('/:id/units/:unitId', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    
    if (req.user.role === 'OWNER' && String(property.owner) !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const unit = property.units.id(req.params.unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    // Import required models for validation
    const Payment = (await import('../models/Payment.js')).default;
    const Lease = (await import('../models/Lease.js')).default;
    const Invoice = (await import('../models/Invoice.js')).default;

    // Validation 1: Check if unit is currently occupied
    if (unit.status === 'OCCUPIED' && unit.tenant) {
      return res.status(400).json({ 
        message: `Cannot delete unit "${unit.name}". The unit is currently occupied. Please move out the tenant before deleting.`,
        details: {
          unitName: unit.name,
          status: unit.status,
          hasTenant: true
        }
      });
    }

    // Validation 2: Check for active leases
    const activeLeases = await Lease.find({ 
      unit: req.params.unitId, 
      status: 'ACTIVE' 
    });
    
    if (activeLeases.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete unit "${unit.name}". There are ${activeLeases.length} active lease(s) associated with this unit. Please end all leases before deleting.`,
        details: {
          unitName: unit.name,
          activeLeases: activeLeases.length,
          leaseIds: activeLeases.map(l => l._id)
        }
      });
    }

    // Validation 3: Check for payment records
    const payments = await Payment.find({ 
      'metadata.unitId': req.params.unitId 
    });
    
    if (payments.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete unit "${unit.name}". There are ${payments.length} payment record(s) associated with this unit. Please contact administrator to handle payment history before deleting.`,
        details: {
          unitName: unit.name,
          totalPayments: payments.length,
          paidPayments: payments.filter(p => p.status === 'SUCCEEDED').length,
          pendingPayments: payments.filter(p => p.status === 'PENDING').length
        }
      });
    }

    // Validation 4: Check for invoices
    const invoices = await Invoice.find({ 
      unit: req.params.unitId 
    });
    
    if (invoices.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete unit "${unit.name}". There are ${invoices.length} invoice(s) associated with this unit. Please resolve all invoices before deleting.`,
        details: {
          unitName: unit.name,
          totalInvoices: invoices.length
        }
      });
    }

    // If all validations pass, delete the unit
    unit.deleteOne();
    await property.save();
    
    res.json({ 
      ok: true, 
      message: `Unit "${unit.name}" deleted successfully`,
      property 
    });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ 
      message: 'Error deleting unit', 
      error: error.message 
    });
  }
});

// Assign tenant to unit (OWNER/ADMIN)
router.post('/:id/units/:unitId/assign', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  const { tenantId } = req.body;
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'OWNER' && String(property.owner) !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const unit = property.units.id(req.params.unitId);
  if (!unit) return res.status(404).json({ message: 'Unit not found' });
  unit.tenant = tenantId;
  unit.status = 'OCCUPIED';
  await property.save();
  res.json(property);
});

export default router;


