import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import Lease from '../models/Lease.js';
import Payment from '../models/Payment.js';
import { generateRentAgreement } from '../services/pdfGenerator.js';
import documentUpload, { USE_CLOUD_STORAGE } from '../middleware/documentUpload.js';

const router = express.Router();

// Generate rent payment records for a lease
const generateRentPayments = async (lease, property, unit) => {
  const payments = [];
  const startDate = new Date(lease.leaseStartDate);
  const endDate = new Date(lease.leaseEndDate);
  
  // Generate monthly payments for the entire lease period
  let currentDate = new Date(startDate);
  let monthCount = 1;
  
  while (currentDate <= endDate) {
    const dueDate = new Date(currentDate);
    dueDate.setDate(1); // First day of the month
    
    const payment = {
      tenant: lease.tenant,
      amount: lease.monthlyRent,
      method: 'CARD', // Default method, will be updated when paid
      status: 'PENDING',
      description: `Rent payment for ${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      metadata: {
        propertyId: lease.property,
        unitId: lease.unit,
        unitNumber: unit.name, // Store the actual unit number (100, 101, 204, 302)
        month: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        dueDate: dueDate.toISOString().split('T')[0],
        type: 'rent_payment'
      }
    };
    
    payments.push(payment);
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    monthCount++;
  }
  
  return await Payment.insertMany(payments);
};

// Upload document for move-in
router.post('/upload-document', authenticate, authorize('OWNER', 'ADMIN'), (req, res, next) => {
  documentUpload.single('document')(req, res, (err) => {
    if (err) {
      console.error('Document upload error:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: 'File size too large. Maximum size is 10MB.',
            error: 'FILE_SIZE_EXCEEDED'
          });
        }
        return res.status(400).json({ 
          message: err.message,
          error: 'UPLOAD_ERROR'
        });
      }
      
      return res.status(400).json({ 
        message: err.message || 'Error uploading document',
        error: 'UPLOAD_ERROR'
      });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ 
          message: 'No file uploaded',
          error: 'NO_FILE'
        });
      }

      // Prepare response with file metadata
      let fileUrl;
      
      if (USE_CLOUD_STORAGE && req.file.path && req.file.path.startsWith('http')) {
        // Cloudinary returns full URL in file.path
        fileUrl = req.file.path;
        console.log('📤 Cloudinary document uploaded:', fileUrl);
      } else {
        // Local storage - create relative path
        const filename = req.file.filename || path.basename(req.file.path);
        fileUrl = `/uploads/documents/${filename}`;
        console.log('📤 Local document uploaded:', fileUrl);
      }
      
      res.json({
        url: fileUrl,
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).json({ 
        message: 'Error processing uploaded file',
        error: error.message
      });
    }
  });
});

// Get available tenants for move-in
router.get('/tenants', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const tenants = await User.find({ role: 'TENANT' })
      .select('firstName middleName lastName email phone nic passportNo');
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tenants', error: error.message });
  }
});

// Move tenant into unit
router.post('/:propertyId/:unitId', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { propertyId, unitId } = req.params;
    const { 
      tenantId, 
      leaseStartDate, 
      leaseEndDate, 
      monthlyRent, 
      securityDeposit = 0,
      terms = {}
    } = req.body;

    // Validate required fields
    if (!tenantId || !leaseStartDate || !leaseEndDate || !monthlyRent) {
      return res.status(400).json({ 
        message: 'Missing required fields: tenantId, leaseStartDate, leaseEndDate, monthlyRent' 
      });
    }

    // Get property and unit
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user owns the property (for owners)
    if (req.user.role === 'OWNER' && String(property.owner) !== req.user.id) {
      return res.status(403).json({ message: 'You can only manage your own properties' });
    }

    const unit = property.units.id(unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    // Check if unit is available
    if (unit.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Unit is not available for move-in' });
    }

    // Get tenant and owner details
    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== 'TENANT') {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const owner = await User.findById(property.owner);
    if (!owner) {
      return res.status(404).json({ message: 'Property owner not found' });
    }

    // Create lease record
    const leaseData = {
      property: propertyId,
      unit: unitId,
      tenant: tenantId,
      owner: property.owner,
      leaseStartDate: new Date(leaseStartDate),
      leaseEndDate: new Date(leaseEndDate),
      monthlyRent: parseFloat(monthlyRent),
      securityDeposit: parseFloat(securityDeposit),
      terms: {
        lateFeeAmount: parseFloat(terms.lateFeeAmount) || 50,
        lateFeeAfterDays: parseInt(terms.lateFeeAfterDays) || 5,
        noticePeriodDays: parseInt(terms.noticePeriodDays) || 30,
        petAllowed: Boolean(terms.petAllowed),
        smokingAllowed: Boolean(terms.smokingAllowed)
      }
    };

    const lease = new Lease(leaseData);
    await lease.save();

    // Update unit status and assign tenant
    unit.status = 'OCCUPIED';
    unit.tenant = tenantId;
    await property.save();

    // Generate PDF agreement
    const pdfData = {
      ...lease.toObject(),
      property: {
        title: property.title,
        address: property.address
      },
      unit: {
        name: unit.name,
        type: unit.type,
        sizeSqFt: unit.sizeSqFt,
        floor: unit.floor,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        parking: unit.parking
      },
      tenant: {
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone
      },
      owner: {
        name: owner.name,
        email: owner.email,
        phone: owner.phone
      }
    };

    const pdfResult = await generateRentAgreement(pdfData);
    
    // Update lease with PDF path
    lease.agreementPdfPath = pdfResult.relativePath;
    await lease.save();

    // Generate rent payment records for the entire lease period
    const rentPayments = await generateRentPayments(lease, property, unit);

    res.json({
      message: 'Move-in successful, rent agreement generated, and payment schedule created',
      lease: lease,
      pdfPath: pdfResult.relativePath,
      pdfFileName: pdfResult.fileName,
      paymentsCreated: rentPayments.length
    });

  } catch (error) {
    console.error('Move-in error:', error);
    res.status(500).json({ message: 'Error processing move-in', error: error.message });
  }
});

// Get lease agreements
router.get('/leases', authenticate, authorize('OWNER', 'ADMIN', 'TENANT'), async (req, res) => {
  try {
    const { unitId } = req.query;
    
    let query = {};
    if (unitId) {
      query.unit = new mongoose.Types.ObjectId(unitId);
    }
    
    // If user is a tenant, only show their own leases
    if (req.user.role === 'TENANT') {
      query.tenant = req.user.id;
    }
    
    const leases = await Lease.find(query)
      .populate('property', 'title address')
      .populate('tenant', 'name email phone')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    res.json(leases);
  } catch (error) {
    console.error('Lease fetch error:', error);
    res.status(500).json({ message: 'Error fetching leases', error: error.message });
  }
});

// Download agreement PDF
router.get('/agreement/:leaseId', authenticate, async (req, res) => {
  try {
    console.log('PDF download request for lease:', req.params.leaseId);
    const lease = await Lease.findById(req.params.leaseId);
    if (!lease) {
      console.log('Lease not found:', req.params.leaseId);
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Check permissions
    if (req.user.role === 'TENANT' && String(lease.tenant) !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'OWNER' && String(lease.owner) !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!lease.agreementPdfPath) {
      console.log('Agreement PDF path not set for lease:', req.params.leaseId);
      return res.status(404).json({ message: 'Agreement PDF not found' });
    }

    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.default.join(process.cwd(), lease.agreementPdfPath);
    
    console.log('PDF file path:', filePath);
    console.log('Agreement PDF path:', lease.agreementPdfPath);
    console.log('File exists:', fs.existsSync(filePath));
    
    if (!fs.existsSync(filePath)) {
      console.log('PDF file not found at:', filePath);
      return res.status(404).json({ message: 'PDF file not found on server' });
    }

    console.log('Sending PDF file:', filePath);
    
    // Set headers for PDF viewing in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="rent-agreement-${lease.agreementNumber}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send the PDF file for inline viewing
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading agreement', error: error.message });
  }
});

// Get lease history for a unit
router.get('/units/:unitId/lease-history', authenticate, async (req, res) => {
  try {
    const { unitId } = req.params;
    
    // Get all leases for this unit (both active and ended)
    const leases = await Lease.find({ unit: unitId })
      .populate('tenant', 'name email phone')
      .populate('property', 'title address')
      .sort({ leaseStartDate: -1 }); // Most recent first
    
    res.json(leases);
  } catch (error) {
    console.error('Error fetching lease history:', error);
    res.status(500).json({ message: 'Error fetching lease history', error: error.message });
  }
});

// Update lease details
router.put('/leases/:leaseId', authenticate, async (req, res) => {
  try {
    const { leaseId } = req.params;
    const updates = req.body;

    // Check user role
    if (req.user.role !== 'ADMIN' && req.user.role !== 'OWNER') {
      return res.status(403).json({ message: 'Access denied. Only admins and owners can update leases.' });
    }

    // Check if lease exists
    const lease = await Lease.findById(leaseId);
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Check if any rent has been collected for this lease
    const payments = await Payment.find({ 
      'metadata.unitId': lease.unit,
      status: 'SUCCEEDED'
    });

    if (payments.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot edit lease after rent has been collected' 
      });
    }

    // Update lease
    const updatedLease = await Lease.findByIdAndUpdate(
      leaseId,
      {
        leaseStartDate: updates.leaseStartDate,
        leaseEndDate: updates.leaseEndDate,
        monthlyRent: updates.monthlyRent,
        securityDeposit: updates.securityDeposit,
        terms: updates.terms,
        notes: updates.notes
      },
      { new: true }
    ).populate('tenant', 'name email phone')
     .populate('property', 'title address');

    // Regenerate PDF with updated information
    const property = await Property.findById(updatedLease.property._id || updatedLease.property);
    const tenant = await User.findById(updatedLease.tenant._id || updatedLease.tenant);
    const owner = await User.findById(property.owner);
    const unit = property.units.id(updatedLease.unit);

    if (property && tenant && owner && unit) {
      const pdfData = {
        ...updatedLease.toObject(),
        property: {
          title: property.title,
          address: property.address
        },
        unit: {
          name: unit.name,
          type: unit.type,
          sizeSqFt: unit.sizeSqFt,
          floor: unit.floor,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          parking: unit.parking
        },
        tenant: {
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone
        },
        owner: {
          name: owner.name,
          email: owner.email,
          phone: owner.phone
        }
      };

      try {
        // Regenerate the PDF
        const pdfResult = await generateRentAgreement(pdfData);
        
        // Update lease with new PDF path
        updatedLease.agreementPdfPath = pdfResult.relativePath;
        await updatedLease.save();
        
        console.log('✅ Rent agreement PDF regenerated:', pdfResult.relativePath);
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        // Continue without failing the update
      }
    }

    // Fetch the updated lease with all fields
    const finalLease = await Lease.findById(updatedLease._id)
      .populate('tenant', 'name email phone')
      .populate('property', 'title address');

    res.json(finalLease);
  } catch (error) {
    console.error('Error updating lease:', error);
    res.status(500).json({ message: 'Error updating lease', error: error.message });
  }
});

export default router;
