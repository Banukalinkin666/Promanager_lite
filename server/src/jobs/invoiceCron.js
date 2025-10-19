import cron from 'node-cron';
import Property from '../models/Property.js';
import Invoice from '../models/Invoice.js';

function getCurrentPeriodUtc() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function startInvoiceCron() {
  if (process.env.AUTO_INVOICES_ENABLED !== 'true') return;
  const schedule = process.env.AUTO_INVOICES_CRON || '0 0 1 * *';

  cron.schedule(schedule, async () => {
    try {
      const period = getCurrentPeriodUtc();
      const properties = await Property.find();
      const toCreate = [];
      for (const property of properties) {
        for (const unit of property.units) {
          if (unit.status === 'OCCUPIED' && unit.tenant) {
            const exists = await Invoice.findOne({ period, unitId: unit._id, tenant: unit.tenant });
            if (!exists) {
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
      if (toCreate.length) {
        await Invoice.insertMany(toCreate);
        console.log(`[invoice-cron] Created ${toCreate.length} invoices for ${period}`);
      } else {
        console.log(`[invoice-cron] No invoices to create for ${period}`);
      }
    } catch (err) {
      console.error('[invoice-cron] Error:', err.message);
    }
  });

  console.log('[invoice-cron] Scheduled with', schedule);
}


