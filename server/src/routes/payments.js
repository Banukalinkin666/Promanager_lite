import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123', { apiVersion: '2024-06-20' });

// Create payment intent for an invoice (TENANT)
router.post('/intent', authenticate, authorize('TENANT'), async (req, res) => {
  const { invoiceId } = req.body;
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  if (String(invoice.tenant) !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(invoice.amount * 100),
    currency: 'usd',
    metadata: { invoiceId: invoice._id.toString(), tenantId: req.user.id },
    automatic_payment_methods: { enabled: true },
  });

  const payment = await Payment.create({
    tenant: req.user.id,
    invoice: invoice._id,
    amount: invoice.amount,
    method: 'CARD',
    status: 'PENDING',
    stripePaymentIntentId: paymentIntent.id,
  });

  res.json({ clientSecret: paymentIntent.client_secret, paymentId: payment._id });
});

// Create payment intent for direct rent payment (TENANT)
router.post('/rent-payment', authenticate, authorize('TENANT'), async (req, res) => {
  try {
    const { amount, month, unitId, propertyId, dueDate, unitNumber } = req.body;
    
    if (!amount || !month || !unitId || !propertyId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: { 
        tenantId: req.user.id,
        unitId: unitId,
        propertyId: propertyId,
        unitNumber: unitNumber,
        month: month,
        dueDate: dueDate,
        type: 'rent_payment'
      },
      automatic_payment_methods: { enabled: true },
    });

    const payment = await Payment.create({
      tenant: req.user.id,
      amount: amount,
      method: 'CARD',
      status: 'PENDING',
      stripePaymentIntentId: paymentIntent.id,
      description: `Rent payment for ${month}`,
      metadata: {
        unitId: unitId,
        propertyId: propertyId,
        unitNumber: unitNumber,
        month: month,
        dueDate: dueDate,
        type: 'rent_payment'
      }
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret, 
      paymentId: payment._id,
      paymentUrl: `https://checkout.stripe.com/pay/${paymentIntent.id}` // For demo purposes
    });
  } catch (error) {
    console.error('Error creating rent payment intent:', error);
    res.status(500).json({ message: 'Error creating payment intent', error: error.message });
  }
});

// Webhook to confirm payment (raw body middleware is mounted in app.js)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      // req.body is a Buffer because of express.raw()
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // No verification in dev: parse JSON
      event = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
    if (payment) {
      payment.status = 'SUCCEEDED';
      payment.paidDate = new Date();
      payment.method = 'CARD'; // Online payment
      await payment.save();
      
      // Update associated invoice if exists
      const invoice = await Invoice.findById(payment.invoice);
      if (invoice) {
        invoice.status = 'PAID';
        await invoice.save();
      }
    }
  }
  res.json({ received: true });
});

// List payments (OWNER/ADMIN view all, TENANT view own)
router.get('/', authenticate, authorize('TENANT', 'OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { status, unitId } = req.query;
    let filter = req.user.role === 'TENANT' ? { tenant: req.user.id } : {};
    
    // Add status filter if provided
    if (status) {
      filter.status = status.toUpperCase();
    }
    
    // Add unitId filter if provided
    if (unitId) {
      filter['metadata.unitId'] = unitId;
    }
    
    const payments = await Payment.find(filter)
      .populate('tenant', 'name firstName lastName nic primaryEmail phone')
      .populate('invoice')
      .populate('metadata.propertyId', 'title address city state country')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
});

// Update payment status (OWNER/ADMIN only)
router.patch('/:id', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { paymentMethod, status, notes } = req.body;
    
    // Validate payment method for manual updates
    if (paymentMethod && !['CASH', 'BANK'].includes(paymentMethod.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid payment method. Only CASH or BANK allowed for manual updates.' });
    }
    
    // Validate status
    if (status && !['PENDING', 'SUCCEEDED', 'FAILED'].includes(status.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid status. Must be PENDING, SUCCEEDED, or FAILED.' });
    }
    
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Update payment
    const updateData = {};
    if (paymentMethod) updateData.method = paymentMethod.toUpperCase();
    if (status) updateData.status = status.toUpperCase();
    if (notes) updateData.notes = notes;
    
    // Set paid date if status is being changed to SUCCEEDED
    if (status && status.toUpperCase() === 'SUCCEEDED' && payment.status !== 'SUCCEEDED') {
      updateData.paidDate = new Date();
    }
    
    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('tenant', 'name firstName lastName nic primaryEmail phone')
    .populate('invoice')
    .populate('metadata.propertyId', 'title address city state country');
    
    res.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Error updating payment', error: error.message });
  }
});

// Delete pending payments for a unit (OWNER/ADMIN only)
router.delete('/unit/:unitId/pending', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { unitId } = req.params;
    
    // Delete all pending payments for this unit
    const result = await Payment.deleteMany({
      'metadata.unitId': unitId,
      status: 'PENDING'
    });
    
    res.json({ 
      message: 'Pending payments deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting pending payments:', error);
    res.status(500).json({ message: 'Error deleting pending payments', error: error.message });
  }
});

export default router;


