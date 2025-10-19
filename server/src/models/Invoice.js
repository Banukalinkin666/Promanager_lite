import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    unitId: { type: mongoose.Schema.Types.ObjectId, required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    period: { type: String, required: true }, // e.g., 2025-10
    status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE'], default: 'PENDING' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true }
);

export default mongoose.model('Invoice', InvoiceSchema);


