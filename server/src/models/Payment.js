import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['CARD', 'BANK', 'CASH'], default: 'CARD' },
    stripePaymentIntentId: { type: String },
    status: { type: String, enum: ['PENDING', 'SUCCEEDED', 'FAILED'], default: 'PENDING' },
    receiptUrl: { type: String },
    description: { type: String },
    notes: { type: String },
    paidDate: { type: Date },
    metadata: {
      unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property.units' },
      propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
      unitNumber: { type: String },
      month: { type: String },
      dueDate: { type: String },
      type: { type: String, enum: ['rent_payment', 'invoice_payment'], default: 'invoice_payment' }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Payment', PaymentSchema);


