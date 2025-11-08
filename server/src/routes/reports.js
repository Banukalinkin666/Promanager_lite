import { Router } from 'express';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import Property from '../models/Property.js';
import Payment from '../models/Payment.js';
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

    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet('Due Rent');
    worksheet.columns = [
      { header: 'Tenant Name', key: 'tenantName', width: 28 },
      { header: 'Property', key: 'property', width: 28 },
      { header: 'Unit', key: 'unit', width: 16 },
      { header: 'Amount', key: 'amount', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Due Date', key: 'dueDate', width: 16 },
      { header: 'Description', key: 'description', width: 32 },
      { header: 'Payment Method', key: 'method', width: 18 },
      { header: 'Paid Date', key: 'paidDate', width: 16 },
      { header: 'Created Date', key: 'createdDate', width: 16 }
    ];
    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    let totalAmount = 0;

    payments.forEach(payment => {
      const tenantName = payment.tenant
        ? `${payment.tenant.firstName || ''} ${payment.tenant.lastName || ''}`.trim() ||
          payment.tenant.email ||
          payment.tenant.phone ||
          '-'
        : '-';

      const unitIdentifier =
        payment.metadata?.unitNumber ||
        payment.metadata?.unitName ||
        (payment.metadata?.unitId?.toString ? payment.metadata.unitId.toString() : payment.metadata?.unitId) ||
        '';

      const dueDateValue = payment.metadata?.dueDate ? new Date(payment.metadata.dueDate) : null;

      worksheet.addRow({
        tenantName,
        property: payment.metadata?.propertyId?.title || 'N/A',
        unit: unitIdentifier,
        amount: Number(payment.amount || 0),
        status: payment.status || '',
        dueDate: dueDateValue,
        description: payment.description || '',
        method: payment.method || '',
        paidDate: payment.paidDate ? new Date(payment.paidDate) : null,
        createdDate: payment.createdAt ? new Date(payment.createdAt) : null
      });

      totalAmount += Number(payment.amount || 0);
    });

    worksheet.getColumn('amount').numFmt = '#,##0.00';
    worksheet.getColumn('dueDate').numFmt = 'yyyy-mm-dd';
    worksheet.getColumn('paidDate').numFmt = 'yyyy-mm-dd';
    worksheet.getColumn('createdDate').numFmt = 'yyyy-mm-dd';

    if (payments.length > 0) {
      const totalRow = worksheet.addRow({
        tenantName: 'Total',
        amount: totalAmount
      });
      totalRow.font = { bold: true };
      totalRow.getCell('tenantName').alignment = { horizontal: 'right' };
    } else {
      worksheet.addRow(['No records found for the selected filters.']);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="due-rent-report-${new Date().toISOString().split('T')[0]}.xlsx"`
    );
    await workbook.xlsx.write(res);
    res.end();

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

    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet('Uncollected Rent');
    worksheet.columns = [
      { header: 'Tenant Name', key: 'tenantName', width: 28 },
      { header: 'Property', key: 'property', width: 28 },
      { header: 'Unit', key: 'unit', width: 16 },
      { header: 'Amount', key: 'amount', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Due Date', key: 'dueDate', width: 16 },
      { header: 'Description', key: 'description', width: 32 },
      { header: 'Payment Method', key: 'method', width: 18 },
      { header: 'Paid Date', key: 'paidDate', width: 16 },
      { header: 'Created Date', key: 'createdDate', width: 16 },
      { header: 'Days Overdue', key: 'daysOverdue', width: 16 }
    ];
    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    let totalAmount = 0;

    payments.forEach(payment => {
      const tenantName = payment.tenant
        ? `${payment.tenant.firstName || ''} ${payment.tenant.lastName || ''}`.trim() ||
          payment.tenant.email ||
          payment.tenant.phone ||
          '-'
        : '-';

      const unitIdentifier =
        payment.metadata?.unitNumber ||
        payment.metadata?.unitName ||
        (payment.metadata?.unitId?.toString ? payment.metadata.unitId.toString() : payment.metadata?.unitId) ||
        '';

      const dueDateValue = payment.metadata?.dueDate ? new Date(payment.metadata.dueDate) : null;
      const daysOverdue =
        payment.status === 'OVERDUE' && dueDateValue
          ? Math.max(
              Math.floor((new Date().setHours(0, 0, 0, 0) - dueDateValue.setHours(0, 0, 0, 0)) /
                (1000 * 60 * 60 * 24)),
              0
            )
          : 0;

      worksheet.addRow({
        tenantName,
        property: payment.metadata?.propertyId?.title || 'N/A',
        unit: unitIdentifier,
        amount: Number(payment.amount || 0),
        status: payment.status || '',
        dueDate: dueDateValue,
        description: payment.description || '',
        method: payment.method || '',
        paidDate: payment.paidDate ? new Date(payment.paidDate) : null,
        createdDate: payment.createdAt ? new Date(payment.createdAt) : null,
        daysOverdue
      });

      totalAmount += Number(payment.amount || 0);
    });

    worksheet.getColumn('amount').numFmt = '#,##0.00';
    worksheet.getColumn('dueDate').numFmt = 'yyyy-mm-dd';
    worksheet.getColumn('paidDate').numFmt = 'yyyy-mm-dd';
    worksheet.getColumn('createdDate').numFmt = 'yyyy-mm-dd';

    if (payments.length > 0) {
      const totalRow = worksheet.addRow({
        tenantName: 'Total',
        amount: totalAmount
      });
      totalRow.font = { bold: true };
      totalRow.getCell('tenantName').alignment = { horizontal: 'right' };
    } else {
      worksheet.addRow(['No records found for the selected filters.']);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="uncollected-rent-report-${new Date().toISOString().split('T')[0]}.xlsx"`
    );
    await workbook.xlsx.write(res);
    res.end();

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
      asOfDate
    } = req.query;

    let data = {};

    switch (reportType) {
      case 'income-expenses':
        data = await generateIncomeExpensesReport(propertyId, year);
        break;
      case 'occupancy-by-property':
        data = await generateOccupancyByPropertyReport(propertyId, asOfDate);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid report type. Only income-expenses and occupancy-by-property are supported.' 
        });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    workbook.modified = new Date();

    if (reportType === 'income-expenses') {
      const { monthLabels = [], properties = [], totals = {} } = data;
      const worksheet = workbook.addWorksheet('Income & Expenses');
      const headers = ['Property', 'Metric', ...monthLabels, 'YTD'];
      worksheet.addRow(headers).font = { bold: true };
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      const metrics = [
        { label: 'Total Income Approved Budget', key: 'budget' },
        { label: 'Total Due Rent', key: 'dueRent' },
        { label: 'Total Occupancy Collection', key: 'collected' },
        { label: 'Total Rent Variance', key: 'variance' }
      ];

      properties.forEach(property => {
        metrics.forEach(metric => {
          const values = property[metric.key] || { months: Array(12).fill(0), ytd: 0 };
          const row = [
            property.propertyName,
            metric.label,
            ...monthLabels.map((_, idx) => Number(values.months?.[idx] ?? 0)),
            Number(values.ytd ?? 0)
          ];
          worksheet.addRow(row);
        });
        worksheet.addRow([]);
      });

      if (properties.length > 0) {
        const totalsMetrics = [
          { label: 'Grand Total Approved Budget', data: totals.budget },
          { label: 'Grand Total Due Rent', data: totals.dueRent },
          { label: 'Grand Total Occupancy Collection', data: totals.collected },
          { label: 'Grand Total Rent Variance', data: totals.variance }
        ];

        totalsMetrics.forEach(metric => {
          const values = metric.data || { months: Array(12).fill(0), ytd: 0 };
          const row = [
            'Totals',
            metric.label,
            ...monthLabels.map((_, idx) => Number(values.months?.[idx] ?? 0)),
            Number(values.ytd ?? 0)
          ];
          const totalsRow = worksheet.addRow(row);
          totalsRow.font = { bold: true };
        });
      } else {
        worksheet.addRow(['No income & expenses data available for the selected filters.']);
      }

      worksheet.getColumn(1).width = 32;
      worksheet.getColumn(2).width = 34;
      for (let col = 3; col <= headers.length; col += 1) {
        worksheet.getColumn(col).width = 14;
        worksheet.getColumn(col).numFmt = '#,##0.000';
      }
    } else {
      const { properties = [], totals = {}, asOfDate: occupancyAsOf } = data;
      const worksheet = workbook.addWorksheet('Occupancy By Property');
      const columns = ['Property', 'Total Units', 'Units Occupied', 'Units Under Maintenance', 'Units Vacant', 'Occupancy %'];

      const formattedDate = occupancyAsOf
        ? new Date(occupancyAsOf).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

      const infoRowNumber = worksheet.addRow([`As of ${formattedDate}`]).number;
      worksheet.mergeCells(infoRowNumber, 1, infoRowNumber, columns.length);
      worksheet.getCell(infoRowNumber, 1).font = { bold: true };

      const headerRow = worksheet.addRow(columns);
      headerRow.font = { bold: true };
      worksheet.views = [{ state: 'frozen', ySplit: 2 }];

      properties.forEach(property => {
        worksheet.addRow([
          property.propertyName,
          property.totalUnits,
          property.occupiedUnits,
          property.maintenanceUnits,
          property.vacantUnits,
          (property.occupancyRate ?? 0) / 100
        ]);
      });

      if (properties.length > 0) {
        const totalsRow = worksheet.addRow([
          'Totals',
          totals.totalUnits ?? 0,
          totals.occupiedUnits ?? 0,
          totals.maintenanceUnits ?? 0,
          totals.vacantUnits ?? 0,
          (totals.occupancyRate ?? 0) / 100
        ]);
        totalsRow.font = { bold: true };
      } else {
        worksheet.addRow(['No occupancy data available for the selected filters.']);
      }

      worksheet.getColumn(1).width = 32;
      worksheet.getColumn(2).width = 16;
      worksheet.getColumn(3).width = 18;
      worksheet.getColumn(4).width = 24;
      worksheet.getColumn(5).width = 16;
      worksheet.getColumn(6).width = 16;
      worksheet.getColumn(6).numFmt = '0.000%';
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="property-management-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx"`
    );
    await workbook.xlsx.write(res);
    res.end();

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
async function generateIncomeExpensesReport(propertyId, year) {
  const reportYear = parseInt(year, 10) || new Date().getFullYear();

  const propertyIdStrings = propertyId
    ? propertyId
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id && id !== 'ALL')
    : [];

  let propertyObjectIds = [];
  try {
    propertyObjectIds = propertyIdStrings.map((id) => new mongoose.Types.ObjectId(id));
  } catch (error) {
    throw new Error('Invalid property identifier provided');
  }

  const propertyQuery = propertyObjectIds.length ? { _id: { $in: propertyObjectIds } } : {};
  const properties = await Property.find(propertyQuery).lean();

  if (!properties.length) {
    return {
      year: reportYear,
      monthLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      properties: [],
      totals: {
        budget: { months: Array(12).fill(0), ytd: 0 },
        dueRent: { months: Array(12).fill(0), ytd: 0 },
        collected: { months: Array(12).fill(0), ytd: 0 },
        variance: { months: Array(12).fill(0), ytd: 0 }
      }
    };
  }

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const paymentFilter = {
    status: { $in: ['PENDING', 'OVERDUE', 'SUCCEEDED'] }
  };

  if (propertyObjectIds.length) {
    paymentFilter.$or = [
      { 'metadata.propertyId': { $in: propertyObjectIds } },
      { 'metadata.propertyId': { $in: propertyIdStrings } }
    ];
  }

  const payments = await Payment.find(paymentFilter).lean();

  const parseDueDate = (payment) => {
    if (payment.metadata?.dueDate) {
      const parsed = new Date(payment.metadata.dueDate);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    if (payment.metadata?.month) {
      const [monthName, maybeYear] = payment.metadata.month.split(' ');
      const parsedYear = parseInt(maybeYear, 10);
      const effectiveYear = Number.isNaN(parsedYear) ? reportYear : parsedYear;
      const parsed = new Date(`${monthName} 1, ${effectiveYear}`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    if (payment.metadata?.dueDateTimestamp) {
      const parsed = new Date(payment.metadata.dueDateTimestamp);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    return null;
  };

  const parseCollectedDate = (payment) => {
    if (payment.paidDate) {
      const paid = new Date(payment.paidDate);
      if (!Number.isNaN(paid.getTime())) return paid;
    }

    if (payment.createdAt) {
      const created = new Date(payment.createdAt);
      if (!Number.isNaN(created.getTime())) return created;
    }

    return null;
  };

  const totals = {
    budget: { months: Array(12).fill(0), ytd: 0 },
    dueRent: { months: Array(12).fill(0), ytd: 0 },
    collected: { months: Array(12).fill(0), ytd: 0 },
    variance: { months: Array(12).fill(0), ytd: 0 }
  };

  const propertyReports = properties.map((property) => {
    const propertyIdStr = property._id.toString();

    const monthlyBudgetBase =
      property.units?.reduce((sum, unit) => sum + (unit.rentAmount || 0), 0) || property.baseRent || 0;

    const budget = {
      months: Array(12).fill(Number(monthlyBudgetBase.toFixed(3))),
      ytd: Number((monthlyBudgetBase * 12).toFixed(3))
    };

    const dueRent = { months: Array(12).fill(0), ytd: 0 };
    const collected = { months: Array(12).fill(0), ytd: 0 };

    payments.forEach((payment) => {
      const metadataPropertyId = payment.metadata?.propertyId;
      const paymentPropertyIdStr = metadataPropertyId?.toString ? metadataPropertyId.toString() : metadataPropertyId;

      if (!paymentPropertyIdStr || paymentPropertyIdStr !== propertyIdStr) {
        return;
      }

      if (['PENDING', 'OVERDUE'].includes(payment.status)) {
        const dueDate = parseDueDate(payment);
        if (dueDate && dueDate.getFullYear() === reportYear) {
          const monthIndex = dueDate.getMonth();
          const amount = Number(payment.metadata?.originalAmount ?? payment.amount ?? 0);
          dueRent.months[monthIndex] += amount;
        }
      }

      if (payment.status === 'SUCCEEDED') {
        const collectedDate = parseCollectedDate(payment);
        if (collectedDate && collectedDate.getFullYear() === reportYear) {
          const monthIndex = collectedDate.getMonth();
          const amount = Number(payment.amount ?? 0);
          collected.months[monthIndex] += amount;
        }
      }
    });

    dueRent.months = dueRent.months.map((value) => Number(value.toFixed(3)));
    dueRent.ytd = Number(dueRent.months.reduce((sum, value) => sum + value, 0).toFixed(3));

    collected.months = collected.months.map((value) => Number(value.toFixed(3)));
    collected.ytd = Number(collected.months.reduce((sum, value) => sum + value, 0).toFixed(3));

    const variance = {
      months: dueRent.months.map((value, index) =>
        Number((value - (collected.months[index] || 0)).toFixed(3))
      ),
      ytd: Number((dueRent.ytd - collected.ytd).toFixed(3))
    };

    totals.budget.months = totals.budget.months.map(
      (value, index) => Number((value + budget.months[index]).toFixed(3))
    );
    totals.budget.ytd = Number((totals.budget.ytd + budget.ytd).toFixed(3));

    totals.dueRent.months = totals.dueRent.months.map(
      (value, index) => Number((value + dueRent.months[index]).toFixed(3))
    );
    totals.dueRent.ytd = Number((totals.dueRent.ytd + dueRent.ytd).toFixed(3));

    totals.collected.months = totals.collected.months.map(
      (value, index) => Number((value + collected.months[index]).toFixed(3))
    );
    totals.collected.ytd = Number((totals.collected.ytd + collected.ytd).toFixed(3));

    totals.variance.months = totals.variance.months.map(
      (value, index) => Number((value + variance.months[index]).toFixed(3))
    );
    totals.variance.ytd = Number((totals.variance.ytd + variance.ytd).toFixed(3));

    return {
      propertyId: property._id,
      propertyName: property.title,
      budget,
      dueRent,
      collected,
      variance
    };
  });

  return {
    year: reportYear,
    monthLabels,
    properties: propertyReports.filter(Boolean),
    totals
  };
}

// Occupancy Report By Property
async function generateOccupancyByPropertyReport(propertyId, asOfDate) {
  const propertyIdStrings = propertyId
    ? propertyId
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id && id !== 'ALL')
    : [];

  let propertyObjectIds = [];
  try {
    propertyObjectIds = propertyIdStrings.map((id) => new mongoose.Types.ObjectId(id));
  } catch (error) {
    throw new Error('Invalid property identifier provided');
  }

  const propertyQuery = propertyObjectIds.length ? { _id: { $in: propertyObjectIds } } : {};
  const properties = await Property.find(propertyQuery).sort({ title: 1 }).lean();

  const effectiveAsOfDate = asOfDate ? new Date(asOfDate) : new Date();

  const totals = {
    totalUnits: 0,
    occupiedUnits: 0,
    maintenanceUnits: 0,
    vacantUnits: 0
  };

  const propertiesWithStats = properties.map((property) => {
    const units = property.units || [];
    const totalUnits = units.length;
    const occupiedUnits = units.filter((unit) => unit.status === 'OCCUPIED').length;
    const maintenanceUnits = units.filter((unit) => unit.status === 'MAINTENANCE').length;
    const vacantUnits = Math.max(totalUnits - occupiedUnits - maintenanceUnits, 0);
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    totals.totalUnits += totalUnits;
    totals.occupiedUnits += occupiedUnits;
    totals.maintenanceUnits += maintenanceUnits;
    totals.vacantUnits += vacantUnits;

    return {
      propertyId: property._id,
      propertyName: property.title,
      totalUnits,
      occupiedUnits,
      maintenanceUnits,
      vacantUnits,
      occupancyRate: Number(occupancyRate.toFixed(3))
    };
  });

  const totalsOccupancyRate =
    totals.totalUnits > 0 ? Number(((totals.occupiedUnits / totals.totalUnits) * 100).toFixed(3)) : 0;

  return {
    asOfDate: effectiveAsOfDate.toISOString(),
    properties: propertiesWithStats,
    totals: {
      ...totals,
      occupancyRate: totalsOccupancyRate
    }
  };
}


// Export Property Management Report
router.get('/property-management/export/excel', authenticate, async (req, res) => {
  try {
    const { 
      reportType = 'income-expenses',
      propertyId, 
      year,
      asOfDate
    } = req.query;

    let data = {};

    switch (reportType) {
      case 'income-expenses':
        data = await generateIncomeExpensesReport(propertyId, year);
        break;
      case 'occupancy-by-property':
        data = await generateOccupancyByPropertyReport(propertyId, asOfDate);
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
