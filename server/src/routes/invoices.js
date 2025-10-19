import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Invoice from '../models/Invoice.js';
import Property from '../models/Property.js';

const router = Router();

// Generate monthly invoices for all occupied units of an owner or admin
router.post('/generate', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  const { period } = req.body; // e.g., 2025-10
  const filter = req.user.role === 'OWNER' ? { owner: req.user.id } : {};
  const properties = await Property.find(filter);
  const toCreate = [];
  for (const property of properties) {
    for (const unit of property.units) {
      if (unit.status === 'OCCUPIED' && unit.tenant) {
        const existing = await Invoice.findOne({ period, unitId: unit._id, tenant: unit.tenant });
        if (!existing) {
          toCreate.push({
            property: property._id,
            unitId: unit._id,
            tenant: unit.tenant,
            amount: unit.rentAmount,
            dueDate: new Date(`${period}-05T00:00:00Z`),
            period,
          });
        }
      }
    }
  }
  const created = await Invoice.insertMany(toCreate);
  res.json({ created: created.length });
});

// List invoices (TENANT: own; OWNER: for their properties; ADMIN: all)
router.get('/', authenticate, authorize('TENANT', 'OWNER', 'ADMIN'), async (req, res) => {
  if (req.user.role === 'TENANT') {
    const invoices = await Invoice.find({ tenant: req.user.id });
    return res.json(invoices);
  }
  if (req.user.role === 'OWNER') {
    const properties = await Property.find({ owner: req.user.id });
    const propertyIds = properties.map((p) => p._id);
    const invoices = await Invoice.find({ property: { $in: propertyIds } });
    return res.json(invoices);
  }
  const invoices = await Invoice.find();
  res.json(invoices);
});

export default router;


