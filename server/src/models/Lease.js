import mongoose from 'mongoose';

const LeaseSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Property.units', required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Lease details
    leaseStartDate: { type: Date, required: true },
    leaseEndDate: { type: Date, required: true },
    monthlyRent: { type: Number, required: true },
    securityDeposit: { type: Number, default: 0 },
    advancePayment: { type: Number, default: 0 }, // Advance payment amount
    
    // Agreement details
    agreementNumber: { type: String, unique: true },
    agreementPdfPath: { type: String },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'EXPIRED', 'TERMINATED'], 
      default: 'ACTIVE' 
    },
    terminatedDate: { type: Date }, // Date when lease was manually terminated
    
    // Uploaded documents
    documents: {
      type: {
        signedLease: {
          url: { type: String },
          filename: { type: String },
          size: { type: Number },
          type: { type: String },
          uploadedAt: { type: Date }
        },
        idProof: {
          url: { type: String },
          filename: { type: String },
          size: { type: Number },
          type: { type: String },
          uploadedAt: { type: Date }
        },
        depositReceipt: {
          url: { type: String },
          filename: { type: String },
          size: { type: Number },
          type: { type: String },
          uploadedAt: { type: Date }
        },
        moveInInspection: {
          url: { type: String },
          filename: { type: String },
          size: { type: Number },
          type: { type: String },
          uploadedAt: { type: Date }
        }
      },
      default: {},
      _id: false
    },
    
    // Terms and conditions
    terms: {
      lateFeeAmount: { type: Number, default: 50 },
      lateFeeAfterDays: { type: Number, default: 5 },
      noticePeriodDays: { type: Number, default: 30 },
      petAllowed: { type: Boolean, default: false },
      smokingAllowed: { type: Boolean, default: false }
    },
    
    // Additional notes
    notes: { type: String },
    
    // Timestamps
    signedDate: { type: Date, default: Date.now },
    moveInDate: { type: Date, default: Date.now },
    moveOutDate: { type: Date }
  },
  { timestamps: true }
);

// Generate agreement number before saving
LeaseSchema.pre('save', async function(next) {
  if (!this.agreementNumber) {
    const count = await mongoose.model('Lease').countDocuments();
    this.agreementNumber = `LA-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('Lease', LeaseSchema);
