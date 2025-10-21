import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
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

      const imageUrls = req.files.map(file => `/uploads/properties/${file.filename}`);
      console.log('Images uploaded successfully:', imageUrls);
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

// Get tenant and rent statistics (OWNER, ADMIN)
router.get('/tenant-rent-stats', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const filter = req.user.role === 'OWNER' ? { owner: req.user.id } : {};
    const properties = await Property.find(filter).populate('units.tenant', 'name firstName lastName email phone');
    
    // Import Payment model
    const Payment = (await import('../models/Payment.js')).default;
    
    // Get all payments for these properties
    const propertyIds = properties.map(p => p._id);
    const payments = await Payment.find({
      'metadata.propertyId': { $in: propertyIds }
    });
    
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
      const propertyPayments = payments.filter(payment => 
        payment.metadata?.propertyId?.toString() === property._id.toString()
      );
      
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
        
        if (paymentStatus === 'SUCCEEDED') {
          rentStatusBreakdown.paid += payment.amount;
        } else {
          if (today > rentDueDate) {
            rentStatusBreakdown.due += payment.amount;
          } else {
            rentStatusBreakdown.pending += payment.amount;
          }
        }
      });
      
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
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'OWNER' && String(property.owner) !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await property.deleteOne();
  res.json({ ok: true });
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
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'OWNER' && String(property.owner) !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const unit = property.units.id(req.params.unitId);
  if (!unit) return res.status(404).json({ message: 'Unit not found' });
  unit.deleteOne();
  await property.save();
  res.json(property);
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


