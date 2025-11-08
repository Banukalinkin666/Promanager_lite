import { Router } from 'express';
import mongoose from 'mongoose';
import Property from '../models/Property.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Lease from '../models/Lease.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Due Rent Report with filters
router.get('/due-rent', authenticate, async (req, res) => {
  try {
    const { propertyId, year, asOfDate } = req.query;

    if (!propertyId) {
      return res.status(400).json({ success: false, message: 'Property selection is required' });
    }

    if (!year) {
      return res.status(400).json({ success: false, message: 'Year is required' });
    }

    const propertyIdStrings = propertyId
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!propertyIdStrings.length) {
      return res.status(400).json({ success: false, message: 'Property selection is required' });
    }

    let propertyObjectIds;
    try {
      propertyObjectIds = propertyIdStrings.map((id) => new mongoose.Types.ObjectId(id));
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid property identifier' });
    }

    const reportYear = parseInt(year, 10);
    if (Number.isNaN(reportYear)) {
      return res.status(400).json({ success: false, message: 'Invalid year' });
    }

    const startOfYear = new Date(reportYear, 0, 1);
    const endOfYear = new Date(reportYear, 11, 31, 23, 59, 59);

    const parsedAsOfDate = asOfDate ? new Date(asOfDate) : new Date();
    const safeAsOfDate = Number.isNaN(parsedAsOfDate.getTime()) ? new Date() : parsedAsOfDate;
    const cutoffDate = safeAsOfDate > endOfYear ? endOfYear : safeAsOfDate;
    cutoffDate.setHours(23, 59, 59, 999);

    const properties = await Property.find({ _id: { $in: propertyObjectIds } })
      .populate('units.tenant', 'firstName lastName email phone');

    if (!properties.length) {
      return res.status(404).json({ success: false, message: 'No matching properties found' });
    }

    const propertyIdSet = new Set(propertyObjectIds.map((id) => id.toString()));

    const rawPayments = await Payment.find({
      status: { $in: ['PENDING', 'OVERDUE'] },
      $or: [
        { 'metadata.propertyId': { $in: propertyObjectIds } },
        { 'metadata.propertyId': { $in: propertyIdStrings } }
      ]
    }).populate('tenant', 'firstName lastName email phone');

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const parseDueDate = (payment) => {
      if (payment.metadata?.dueDate) {
        const parsed = new Date(payment.metadata.dueDate);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }

      if (payment.metadata?.month) {
        const [monthName, maybeYear] = payment.metadata.month.split(' ');
        const parsedYear = parseInt(maybeYear, 10);
        const effectiveYear = Number.isNaN(parsedYear) ? reportYear : parsedYear;
        const parsed = new Date(`${monthName} 1, ${effectiveYear}`);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }

      if (payment.metadata?.dueDateTimestamp) {
        const parsed = new Date(payment.metadata.dueDateTimestamp);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }

      return null;
    };

    const ensureUnitName = (unit) => {
      return (
        unit?.name ||
        unit?.unit ||
        unit?.unitName ||
        unit?.unitNumber ||
        unit?.title ||
        (unit?._id ? `Unit ${unit._id.toString().slice(-4)}` : 'Unit')
      );
    };

    const dueRentResults = [];

    for (const property of properties) {
      const propertyIdStr = property._id.toString();

      const monthsAccumulator = Array(12).fill(0);
      const unitsMap = new Map();

      property.units.forEach((unit) => {
        const unitKey = unit._id ? unit._id.toString() : ensureUnitName(unit);
        const tenantName = unit.tenant
          ? `${unit.tenant.firstName || ''} ${unit.tenant.lastName || ''}`.trim() || unit.tenant.email || '-'
          : '-';

        unitsMap.set(unitKey, {
          unitId: unit._id,
          unitName: ensureUnitName(unit),
          tenantName: tenantName || '-',
          months: Array(12).fill(0)
        });
      });

      const propertyPayments = rawPayments.filter((payment) => {
        const metadataPropertyId = payment.metadata?.propertyId;
        const paymentPropertyIdStr = metadataPropertyId?.toString
          ? metadataPropertyId.toString()
          : metadataPropertyId;

        return paymentPropertyIdStr && propertyIdSet.has(paymentPropertyIdStr) && paymentPropertyIdStr === propertyIdStr;
      });

      propertyPayments.forEach((payment) => {
        const dueDate = parseDueDate(payment);
        if (!dueDate) {
          return;
        }

        if (dueDate.getFullYear() !== reportYear) {
          return;
        }

        if (dueDate < startOfYear || dueDate > cutoffDate) {
          return;
        }

        const monthIndex = dueDate.getMonth();
        const amount = Number(payment.metadata?.originalAmount ?? payment.amount ?? 0);

        monthsAccumulator[monthIndex] += amount;

        const unitKey =
          payment.metadata?.unitId?.toString?.() ||
          payment.metadata?.unitNumber ||
          payment.metadata?.unitName ||
          'UNKNOWN_UNIT';

        if (!unitsMap.has(unitKey)) {
          const tenantName = payment.tenant
            ? `${payment.tenant.firstName || ''} ${payment.tenant.lastName || ''}`.trim() || payment.tenant.email || '-'
            : '-';

          unitsMap.set(unitKey, {
            unitId: payment.metadata?.unitId || null,
            unitName: payment.metadata?.unitNumber
              ? `Unit ${payment.metadata.unitNumber}`
              : payment.metadata?.unitName || 'Unit',
            tenantName: tenantName || '-',
            months: Array(12).fill(0)
          });
        }

        const unitData = unitsMap.get(unitKey);

        if (payment.tenant && (!unitData.tenantName || unitData.tenantName === '-')) {
          const tenantName = `${payment.tenant.firstName || ''} ${payment.tenant.lastName || ''}`.trim();
          unitData.tenantName = tenantName || payment.tenant.email || '-';
        }

        unitData.months[monthIndex] += amount;
      });

      const units = Array.from(unitsMap.values()).map((unitData) => {
        const unitMonths = unitData.months.map((value) => Number(value.toFixed(3)));
        const unitYtd = Number(unitMonths.reduce((sum, value) => sum + value, 0).toFixed(3));

        return {
          unitId: unitData.unitId,
          unitName: unitData.unitName,
          tenantName: unitData.tenantName || '-',
          summary: {
            months: unitMonths,
            ytd: unitYtd
          }
        };
      });

      units.sort((a, b) => (a.unitName || '').localeCompare(b.unitName || ''));

      const propertyMonths = monthsAccumulator.map((value) => Number(value.toFixed(3)));
      const propertyYtd = Number(propertyMonths.reduce((sum, value) => sum + value, 0).toFixed(3));

      dueRentResults.push({
        propertyId: property._id,
        propertyName: property.title,
        propertyAddress: property.address,
        summary: {
          months: propertyMonths,
          ytd: propertyYtd
        },
        units
      });
    }

    dueRentResults.sort((a, b) => a.propertyName.localeCompare(b.propertyName));

    const totals = {
      months: Array(12).fill(0),
      ytd: 0
    };

    dueRentResults.forEach((property) => {
      property.summary.months.forEach((value, index) => {
        totals.months[index] += value;
      });
      totals.ytd += property.summary.ytd;
    });

    totals.months = totals.months.map((value) => Number(value.toFixed(3)));
    totals.ytd = Number(totals.ytd.toFixed(3));

    res.json({
      success: true,
      data: {
        year: reportYear,
        asOfDate: cutoffDate.toISOString().split('T')[0],
        monthLabels,
        totals,
        properties: dueRentResults
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
    const { propertyId, year } = req.query;

    if (!year) {
      return res.status(400).json({ success: false, message: 'Year is required' });
    }

    const reportYear = parseInt(year, 10);
    if (Number.isNaN(reportYear)) {
      return res.status(400).json({ success: false, message: 'Invalid year' });
    }

    const propertyIdStrings = propertyId
      ? propertyId
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    let propertyObjectIds = [];
    try {
      propertyObjectIds = propertyIdStrings.length
        ? propertyIdStrings.map((id) => new mongoose.Types.ObjectId(id))
        : [];
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid property identifier' });
    }

    const propertyQuery = propertyObjectIds.length
      ? { _id: { $in: propertyObjectIds } }
      : {};

    const properties = await Property.find(propertyQuery)
      .populate('units.tenant', 'firstName lastName email phone');

    if (!properties.length) {
      return res.status(404).json({ success: false, message: 'No matching properties found' });
    }

    const propertyIdSet = new Set(propertyObjectIds.map((id) => id.toString()));

    const paymentQuery = {
      status: { $in: ['PENDING', 'OVERDUE'] }
    };

    if (propertyObjectIds.length) {
      paymentQuery.$or = [
        { 'metadata.propertyId': { $in: propertyObjectIds } },
        { 'metadata.propertyId': { $in: propertyIdStrings } }
      ];
    }

    const rawPayments = await Payment.find(paymentQuery)
      .populate('tenant', 'firstName lastName email phone');

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const parseDueDate = (payment) => {
      if (payment.metadata?.dueDate) {
        const parsed = new Date(payment.metadata.dueDate);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }

      if (payment.metadata?.month) {
        const [monthName, maybeYear] = payment.metadata.month.split(' ');
        const parsedYear = parseInt(maybeYear, 10);
        const effectiveYear = Number.isNaN(parsedYear) ? reportYear : parsedYear;
        const parsed = new Date(`${monthName} 1, ${effectiveYear}`);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }

      if (payment.metadata?.dueDateTimestamp) {
        const parsed = new Date(payment.metadata.dueDateTimestamp);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }

      return null;
    };

    const ensureUnitName = (unit) => {
      return (
        unit?.name ||
        unit?.unit ||
        unit?.unitName ||
        unit?.unitNumber ||
        unit?.title ||
        (unit?._id ? `Unit ${unit._id.toString().slice(-4)}` : 'Unit')
      );
    };

    const uncollectedResults = [];

    for (const property of properties) {
      const propertyIdStr = property._id.toString();

      const summaryMonths = Array(12).fill(0);
      const unitsMap = new Map();

      const propertyPayments = rawPayments.filter((payment) => {
        const metadataPropertyId = payment.metadata?.propertyId;
        const paymentPropertyIdStr = metadataPropertyId?.toString
          ? metadataPropertyId.toString()
          : metadataPropertyId;

        if (!paymentPropertyIdStr) return false;

        if (propertyIdSet.size === 0) {
          return paymentPropertyIdStr === propertyIdStr;
        }

        return propertyIdSet.has(paymentPropertyIdStr) && paymentPropertyIdStr === propertyIdStr;
      });

      propertyPayments.forEach((payment) => {
        const dueDate = parseDueDate(payment);
        if (!dueDate || dueDate.getFullYear() !== reportYear) {
          return;
        }

        const monthIndex = dueDate.getMonth();
        const amount = Number(payment.metadata?.originalAmount ?? payment.amount ?? 0);

        summaryMonths[monthIndex] += amount;

        const unitKey =
          payment.metadata?.unitId?.toString?.() ||
          payment.metadata?.unitNumber ||
          payment.metadata?.unitName ||
          'UNKNOWN_UNIT';

        if (!unitsMap.has(unitKey)) {
          const tenantName = payment.tenant
            ? `${payment.tenant.firstName || ''} ${payment.tenant.lastName || ''}`.trim() || payment.tenant.email || '-'
            : '-';

          unitsMap.set(unitKey, {
            unitId: payment.metadata?.unitId || null,
            unitName: payment.metadata?.unitNumber
              ? `Unit ${payment.metadata.unitNumber}`
              : payment.metadata?.unitName || ensureUnitName({ name: payment.metadata?.unitNumber }),
            tenantName: tenantName || '-',
            months: Array(12).fill(0)
          });
        }

        const unitData = unitsMap.get(unitKey);

        if (payment.tenant && (!unitData.tenantName || unitData.tenantName === '-')) {
          const tenantName = `${payment.tenant.firstName || ''} ${payment.tenant.lastName || ''}`.trim();
          unitData.tenantName = tenantName || payment.tenant.email || '-';
        }

        unitData.months[monthIndex] += amount;
      });

      const propertySummaryMonths = summaryMonths.map((value) => Number(value.toFixed(3)));
      const propertySummaryYtd = Number(propertySummaryMonths.reduce((sum, value) => sum + value, 0).toFixed(3));

      const units = Array.from(unitsMap.values())
        .map((unitData) => {
          const unitMonths = unitData.months.map((value) => Number(value.toFixed(3)));
          const unitYtd = Number(unitMonths.reduce((sum, value) => sum + value, 0).toFixed(3));
          return {
            unitId: unitData.unitId,
            unitName: unitData.unitName,
            tenantName: unitData.tenantName,
            summary: {
              months: unitMonths,
              ytd: unitYtd
            }
          };
        })
        .filter((unit) => unit.summary.ytd > 0)
        .sort((a, b) => (a.unitName || '').localeCompare(b.unitName || ''));

      const unitsTotals = units.reduce(
        (acc, unit) => {
          unit.summary.months.forEach((value, index) => {
            acc.months[index] += value;
          });
          acc.ytd += unit.summary.ytd;
          return acc;
        },
        { months: Array(12).fill(0), ytd: 0 }
      );

      const occupancyDifference = {
        months: propertySummaryMonths.map((value, index) => Number((value - (unitsTotals.months[index] || 0)).toFixed(3))),
        ytd: Number((propertySummaryYtd - unitsTotals.ytd).toFixed(3))
      };

      if (propertySummaryYtd > 0 || units.length > 0 || occupancyDifference.ytd !== 0) {
        uncollectedResults.push({
          propertyId: property._id,
          propertyName: property.title,
          summary: {
            months: propertySummaryMonths,
            ytd: propertySummaryYtd
          },
          units,
          occupancyDifference
        });
      }
    }

    const totals = {
      months: Array(12).fill(0),
      ytd: 0
    };

    uncollectedResults.forEach((property) => {
      property.summary.months.forEach((value, index) => {
        totals.months[index] += value;
      });
      totals.ytd += property.summary.ytd;
    });

    totals.months = totals.months.map((value) => Number(value.toFixed(3)));
    totals.ytd = Number(totals.ytd.toFixed(3));

    res.json({
      success: true,
      data: {
        year: reportYear,
        monthLabels,
        properties: uncollectedResults,
        totals
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

// Property Management Reports
router.get('/property-management', authenticate, async (req, res) => {
  try {
    const { 
      reportType = 'income-expenses',
      propertyId, 
      year,
      page = 1,
      limit = 50
    } = req.query;

    let data = {};

    switch (reportType) {
      case 'income-expenses':
        data = await generateIncomeExpensesReport(propertyId, year, page, limit);
        break;
      case 'occupancy-by-property':
        data = await generateOccupancyByPropertyReport(propertyId, year, page, limit);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid report type. Only income-expenses and occupancy-by-property are supported.' 
        });
    }

    res.json({
      success: true,
      data: {
        reportType,
        ...data
      }
    });

  } catch (error) {
    console.error('Property management report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate property management report',
      error: error.message 
    });
  }
});

// Income & Expenses Report
async function generateIncomeExpensesReport(propertyId, year, page, limit) {
  const filter = {};
  
  if (propertyId) filter['metadata.propertyId'] = propertyId;
  
  if (year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    filter.createdAt = {
      $gte: startDate,
      $lte: endDate
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get all payments for the property
  const payments = await Payment.find(filter)
    .populate('tenant', 'firstName lastName email phone')
    .populate('metadata.propertyId', 'title address')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalCount = await Payment.countDocuments(filter);

  // Calculate income summary
  const incomeSummary = await Payment.aggregate([
    { $match: { ...filter, status: 'SUCCEEDED' } },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);

  // Calculate monthly breakdown
  const monthlyBreakdown = await Payment.aggregate([
    { $match: { ...filter, status: 'SUCCEEDED' } },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        totalIncome: { $sum: '$amount' },
        transactionCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);

  // Calculate status breakdown
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

  return {
    payments: payments.map(payment => ({
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
      method: payment.method,
      description: payment.description,
      paidDate: payment.paidDate,
      createdAt: payment.createdAt
    })),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalCount,
      hasNext: skip + payments.length < totalCount,
      hasPrev: parseInt(page) > 1
    },
    summary: incomeSummary[0] || {
      totalIncome: 0,
      totalTransactions: 0,
      averageAmount: 0
    },
    breakdown: {
      monthly: monthlyBreakdown,
      status: statusBreakdown
    }
  };
}

// Occupancy Report By Property
async function generateOccupancyByPropertyReport(propertyId, year, page, limit) {
  const filter = {};
  
  if (propertyId) filter._id = propertyId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get properties with occupancy data
  const properties = await Property.find(filter)
    .populate('owner', 'name email')
    .sort({ title: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalCount = await Property.countDocuments(filter);

  // Calculate occupancy statistics for each property
  const propertiesWithStats = await Promise.all(properties.map(async (property) => {
    const totalUnits = property.units.length;
    const occupiedUnits = property.units.filter(unit => unit.status === 'OCCUPIED').length;
    const vacantUnits = property.units.filter(unit => unit.status === 'AVAILABLE').length;
    const maintenanceUnits = property.units.filter(unit => unit.status === 'MAINTENANCE').length;
    
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Get current tenants
    const currentTenants = await User.find({
      _id: { $in: property.units.filter(unit => unit.tenant).map(unit => unit.tenant) }
    }).select('firstName lastName email phone');

    return {
      id: property._id,
      title: property.title,
      address: property.address,
      owner: {
        name: property.owner.name,
        email: property.owner.email
      },
      totalUnits,
      occupiedUnits,
      vacantUnits,
      maintenanceUnits,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      currentTenants: currentTenants.map(tenant => ({
        name: `${tenant.firstName} ${tenant.lastName}`,
        email: tenant.email,
        phone: tenant.phone
      }))
    };
  }));

  return {
    properties: propertiesWithStats,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalCount,
      hasNext: skip + properties.length < totalCount,
      hasPrev: parseInt(page) > 1
    }
  };
}


// Export Property Management Report
router.get('/property-management/export/excel', authenticate, async (req, res) => {
  try {
    const { 
      reportType = 'income-expenses',
      propertyId, 
      year
    } = req.query;

    let data = {};

    switch (reportType) {
      case 'income-expenses':
        data = await generateIncomeExpensesReport(propertyId, year, 1, 10000);
        break;
      case 'occupancy-by-property':
        data = await generateOccupancyByPropertyReport(propertyId, year, 1, 10000);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid report type. Only income-expenses and occupancy-by-property are supported.' 
        });
    }

    // Set headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="property-management-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx"`);

    // For now, return JSON (you can implement actual Excel generation later)
    res.json({
      success: true,
      message: 'Excel export functionality will be implemented',
      data
    });

  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export property management report',
      error: error.message 
    });
  }
});

export default router;
