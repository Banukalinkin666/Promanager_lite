import { Router } from 'express';
import Property from '../models/Property.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Lease from '../models/Lease.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Due Rent Report with filters
router.get('/due-rent', authenticate, async (req, res) => {
  try {
    const { 
      propertyId, 
      unitId, 
      tenantId, 
      status, 
      dueDateFrom, 
      dueDateTo,
      amountFrom,
      amountTo,
      sortBy = 'dueDate',
      sortOrder = 'asc',
      page = 1,
      limit = 50
    } = req.query;

    // Build filter criteria
    const filter = {};
    
    if (propertyId) filter['metadata.propertyId'] = propertyId;
    if (unitId) filter['metadata.unitId'] = unitId;
    if (tenantId) filter.tenant = tenantId;
    if (status) filter.status = status;
    
    // Date range filters
    if (dueDateFrom || dueDateTo) {
      filter.metadata = filter.metadata || {};
      filter.metadata.dueDate = {};
      if (dueDateFrom) filter.metadata.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) filter.metadata.dueDate.$lte = new Date(dueDateTo);
    }
    
    // Amount range filters
    if (amountFrom || amountTo) {
      filter.amount = {};
      if (amountFrom) filter.amount.$gte = parseFloat(amountFrom);
      if (amountTo) filter.amount.$lte = parseFloat(amountTo);
    }

    // Default to pending/overdue payments
    if (!status) {
      filter.status = { $in: ['PENDING', 'OVERDUE'] };
    }

    // Build sort criteria
    const sort = {};
    if (sortBy === 'dueDate') {
      sort['metadata.dueDate'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'amount') {
      sort.amount = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'tenant') {
      sort.tenant = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'property') {
      sort['metadata.propertyId'] = sortOrder === 'desc' ? -1 : 1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get payments with populated data
    const payments = await Payment.find(filter)
      .populate('tenant', 'firstName lastName email phone')
      .populate('metadata.propertyId', 'title address')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Payment.countDocuments(filter);

    // Calculate summary statistics
    const summary = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      }
    ]);

    // Get status breakdown
    const statusBreakdown = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get property-wise breakdown
    const propertyBreakdown = await Payment.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'properties',
          localField: 'metadata.propertyId',
          foreignField: '_id',
          as: 'property'
        }
      },
      { $unwind: '$property' },
      {
        $group: {
          _id: '$property.title',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Format response
    const formattedPayments = payments.map(payment => ({
      id: payment._id,
      tenant: {
        name: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
        email: payment.tenant.email,
        phone: payment.tenant.phone
      },
      property: payment.metadata.propertyId.title,
      unit: payment.metadata.unitId,
      amount: payment.amount,
      status: payment.status,
      dueDate: payment.metadata.dueDate,
      description: payment.description,
      method: payment.method,
      paidDate: payment.paidDate,
      createdAt: payment.createdAt
    }));

    res.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: skip + payments.length < totalCount,
          hasPrev: parseInt(page) > 1
        },
        summary: summary[0] || {
          totalAmount: 0,
          totalCount: 0,
          averageAmount: 0,
          minAmount: 0,
          maxAmount: 0
        },
        breakdown: {
          status: statusBreakdown,
          property: propertyBreakdown
        }
      }
    });

  } catch (error) {
    console.error('Due rent report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate due rent report',
      error: error.message 
    });
  }
});

// Export Due Rent Report as Excel
router.get('/due-rent/export/excel', authenticate, async (req, res) => {
  try {
    const { 
      propertyId, 
      unitId, 
      tenantId, 
      status, 
      dueDateFrom, 
      dueDateTo,
      amountFrom,
      amountTo
    } = req.query;

    // Build filter criteria (same as above)
    const filter = {};
    
    if (propertyId) filter['metadata.propertyId'] = propertyId;
    if (unitId) filter['metadata.unitId'] = unitId;
    if (tenantId) filter.tenant = tenantId;
    if (status) filter.status = status;
    
    if (dueDateFrom || dueDateTo) {
      filter.metadata = filter.metadata || {};
      filter.metadata.dueDate = {};
      if (dueDateFrom) filter.metadata.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) filter.metadata.dueDate.$lte = new Date(dueDateTo);
    }
    
    if (amountFrom || amountTo) {
      filter.amount = {};
      if (amountFrom) filter.amount.$gte = parseFloat(amountFrom);
      if (amountTo) filter.amount.$lte = parseFloat(amountTo);
    }

    if (!status) {
      filter.status = { $in: ['PENDING', 'OVERDUE'] };
    }

    // Get all payments (no pagination for export)
    const payments = await Payment.find(filter)
      .populate('tenant', 'firstName lastName email phone')
      .populate('metadata.propertyId', 'title address')
      .sort({ 'metadata.dueDate': 1 });

    // Format for Excel export
    const excelData = payments.map(payment => ({
      'Tenant Name': `${payment.tenant.firstName} ${payment.tenant.lastName}`,
      'Property': payment.metadata.propertyId.title,
      'Unit': payment.metadata.unitId,
      'Amount': payment.amount,
      'Status': payment.status,
      'Due Date': payment.metadata.dueDate,
      'Description': payment.description,
      'Payment Method': payment.method,
      'Paid Date': payment.paidDate,
      'Created Date': payment.createdAt
    }));

    // Set headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="due-rent-report-${new Date().toISOString().split('T')[0]}.xlsx"`);

    // For now, return JSON (you can implement actual Excel generation later)
    res.json({
      success: true,
      message: 'Excel export functionality will be implemented',
      data: excelData
    });

  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export due rent report',
      error: error.message 
    });
  }
});

// Export Due Rent Report as PDF
router.get('/due-rent/export/pdf', authenticate, async (req, res) => {
  try {
    const { 
      propertyId, 
      unitId, 
      tenantId, 
      status, 
      dueDateFrom, 
      dueDateTo,
      amountFrom,
      amountTo
    } = req.query;

    // Build filter criteria (same as above)
    const filter = {};
    
    if (propertyId) filter['metadata.propertyId'] = propertyId;
    if (unitId) filter['metadata.unitId'] = unitId;
    if (tenantId) filter.tenant = tenantId;
    if (status) filter.status = status;
    
    if (dueDateFrom || dueDateTo) {
      filter.metadata = filter.metadata || {};
      filter.metadata.dueDate = {};
      if (dueDateFrom) filter.metadata.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) filter.metadata.dueDate.$lte = new Date(dueDateTo);
    }
    
    if (amountFrom || amountTo) {
      filter.amount = {};
      if (amountFrom) filter.amount.$gte = parseFloat(amountFrom);
      if (amountTo) filter.amount.$lte = parseFloat(amountTo);
    }

    if (!status) {
      filter.status = { $in: ['PENDING', 'OVERDUE'] };
    }

    // Get all payments
    const payments = await Payment.find(filter)
      .populate('tenant', 'firstName lastName email phone')
      .populate('metadata.propertyId', 'title address')
      .sort({ 'metadata.dueDate': 1 });

    // Calculate summary
    const summary = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="due-rent-report-${new Date().toISOString().split('T')[0]}.pdf"`);

    // For now, return JSON (you can implement actual PDF generation later)
    res.json({
      success: true,
      message: 'PDF export functionality will be implemented',
      data: {
        payments,
        summary: summary[0] || { totalAmount: 0, totalCount: 0 }
      }
    });

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export due rent report',
      error: error.message 
    });
  }
});

// Uncollected Rent Report with filters
router.get('/uncollected-rent', authenticate, async (req, res) => {
  try {
    const { 
      propertyId, 
      year,
      month,
      status = 'PENDING,OVERDUE',
      sortBy = 'dueDate',
      sortOrder = 'asc',
      page = 1,
      limit = 50
    } = req.query;

    // Build filter criteria
    const filter = {};
    
    if (propertyId) filter['metadata.propertyId'] = propertyId;
    
    // Status filter - default to uncollected (pending/overdue)
    if (status) {
      const statusArray = status.split(',').map(s => s.trim());
      filter.status = { $in: statusArray };
    } else {
      filter.status = { $in: ['PENDING', 'OVERDUE'] };
    }
    
    // Year filter
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      filter.metadata = filter.metadata || {};
      filter.metadata.dueDate = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    // Month filter (if year is also provided)
    if (month && year) {
      const startDate = new Date(`${year}-${month.padStart(2, '0')}-01`);
      const endDate = new Date(`${year}-${month.padStart(2, '0')}-31`);
      filter.metadata = filter.metadata || {};
      filter.metadata.dueDate = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Build sort criteria
    const sort = {};
    if (sortBy === 'dueDate') {
      sort['metadata.dueDate'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'amount') {
      sort.amount = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'tenant') {
      sort.tenant = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'property') {
      sort['metadata.propertyId'] = sortOrder === 'desc' ? -1 : 1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get payments with populated data
    const payments = await Payment.find(filter)
      .populate('tenant', 'firstName lastName email phone')
      .populate('metadata.propertyId', 'title address')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Payment.countDocuments(filter);

    // Calculate summary statistics
    const summary = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      }
    ]);

    // Get status breakdown
    const statusBreakdown = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get property-wise breakdown
    const propertyBreakdown = await Payment.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'properties',
          localField: 'metadata.propertyId',
          foreignField: '_id',
          as: 'property'
        }
      },
      { $unwind: '$property' },
      {
        $group: {
          _id: '$property.title',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get monthly breakdown (if year is provided)
    let monthlyBreakdown = [];
    if (year) {
      monthlyBreakdown = await Payment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              month: { $month: '$metadata.dueDate' },
              year: { $year: '$metadata.dueDate' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.month': 1 } }
      ]);
    }

    // Format response
    const formattedPayments = payments.map(payment => ({
      id: payment._id,
      tenant: {
        name: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
        email: payment.tenant.email,
        phone: payment.tenant.phone
      },
      property: payment.metadata.propertyId.title,
      unit: payment.metadata.unitId,
      amount: payment.amount,
      status: payment.status,
      dueDate: payment.metadata.dueDate,
      description: payment.description,
      method: payment.method,
      paidDate: payment.paidDate,
      createdAt: payment.createdAt,
      daysOverdue: payment.status === 'OVERDUE' ? 
        Math.floor((new Date() - new Date(payment.metadata.dueDate)) / (1000 * 60 * 60 * 24)) : 0
    }));

    res.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: skip + payments.length < totalCount,
          hasPrev: parseInt(page) > 1
        },
        summary: summary[0] || {
          totalAmount: 0,
          totalCount: 0,
          averageAmount: 0,
          minAmount: 0,
          maxAmount: 0
        },
        breakdown: {
          status: statusBreakdown,
          property: propertyBreakdown,
          monthly: monthlyBreakdown
        }
      }
    });

  } catch (error) {
    console.error('Uncollected rent report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate uncollected rent report',
      error: error.message 
    });
  }
});

// Export Uncollected Rent Report as Excel
router.get('/uncollected-rent/export/excel', authenticate, async (req, res) => {
  try {
    const { 
      propertyId, 
      year,
      month,
      status = 'PENDING,OVERDUE'
    } = req.query;

    // Build filter criteria (same as above)
    const filter = {};
    
    if (propertyId) filter['metadata.propertyId'] = propertyId;
    
    if (status) {
      const statusArray = status.split(',').map(s => s.trim());
      filter.status = { $in: statusArray };
    } else {
      filter.status = { $in: ['PENDING', 'OVERDUE'] };
    }
    
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      filter.metadata = filter.metadata || {};
      filter.metadata.dueDate = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    if (month && year) {
      const startDate = new Date(`${year}-${month.padStart(2, '0')}-01`);
      const endDate = new Date(`${year}-${month.padStart(2, '0')}-31`);
      filter.metadata = filter.metadata || {};
      filter.metadata.dueDate = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Get all payments (no pagination for export)
    const payments = await Payment.find(filter)
      .populate('tenant', 'firstName lastName email phone')
      .populate('metadata.propertyId', 'title address')
      .sort({ 'metadata.dueDate': 1 });

    // Format for Excel export
    const excelData = payments.map(payment => ({
      'Tenant Name': `${payment.tenant.firstName} ${payment.tenant.lastName}`,
      'Property': payment.metadata.propertyId.title,
      'Unit': payment.metadata.unitId,
      'Amount': payment.amount,
      'Status': payment.status,
      'Due Date': payment.metadata.dueDate,
      'Description': payment.description,
      'Payment Method': payment.method,
      'Paid Date': payment.paidDate,
      'Created Date': payment.createdAt,
      'Days Overdue': payment.status === 'OVERDUE' ? 
        Math.floor((new Date() - new Date(payment.metadata.dueDate)) / (1000 * 60 * 60 * 24)) : 0
    }));

    // Set headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="uncollected-rent-report-${new Date().toISOString().split('T')[0]}.xlsx"`);

    // For now, return JSON (you can implement actual Excel generation later)
    res.json({
      success: true,
      message: 'Excel export functionality will be implemented',
      data: excelData
    });

  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export uncollected rent report',
      error: error.message 
    });
  }
});

// Export Uncollected Rent Report as PDF
router.get('/uncollected-rent/export/pdf', authenticate, async (req, res) => {
  try {
    const { 
      propertyId, 
      year,
      month,
      status = 'PENDING,OVERDUE'
    } = req.query;

    // Build filter criteria (same as above)
    const filter = {};
    
    if (propertyId) filter['metadata.propertyId'] = propertyId;
    
    if (status) {
      const statusArray = status.split(',').map(s => s.trim());
      filter.status = { $in: statusArray };
    } else {
      filter.status = { $in: ['PENDING', 'OVERDUE'] };
    }
    
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      filter.metadata = filter.metadata || {};
      filter.metadata.dueDate = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    if (month && year) {
      const startDate = new Date(`${year}-${month.padStart(2, '0')}-01`);
      const endDate = new Date(`${year}-${month.padStart(2, '0')}-31`);
      filter.metadata = filter.metadata || {};
      filter.metadata.dueDate = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Get all payments
    const payments = await Payment.find(filter)
      .populate('tenant', 'firstName lastName email phone')
      .populate('metadata.propertyId', 'title address')
      .sort({ 'metadata.dueDate': 1 });

    // Calculate summary
    const summary = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="uncollected-rent-report-${new Date().toISOString().split('T')[0]}.pdf"`);

    // For now, return JSON (you can implement actual PDF generation later)
    res.json({
      success: true,
      message: 'PDF export functionality will be implemented',
      data: {
        payments,
        summary: summary[0] || { totalAmount: 0, totalCount: 0 }
      }
    });

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export uncollected rent report',
      error: error.message 
    });
  }
});

export default router;
