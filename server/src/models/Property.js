import mongoose from 'mongoose';

const UnitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['APARTMENT', 'OFFICE', 'VILLA', 'STUDIO', 'PENTHOUSE', 'OTHER'], default: 'APARTMENT' },
    sizeSqFt: { type: Number },
    floor: { type: Number, default: 0 },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    parking: { type: Number, default: 0 },
    rentAmount: { type: Number, required: true },
    status: { type: String, enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'], default: 'AVAILABLE' },
    amenities: [{ type: String }],
    electricityMeterNo: { type: String },
    waterMeterNo: { type: String },
    photos: [{ type: String }],
    documents: [{ type: String }],
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true, timestamps: true }
);

const PropertySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    address: { type: String, required: true },
    type: { type: String, enum: ['RESIDENTIAL', 'COMMERCIAL', 'MIXED'], default: 'RESIDENTIAL' },
    description: { type: String },
    
    // Location details
    country: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    
    // Property structure
    propertyStructure: { type: String, enum: ['SINGLE_UNIT', 'MULTI_UNIT'], default: 'SINGLE_UNIT' },
    baseRent: { type: Number, required: true },
    
    // Meter numbers
    electricityMeterNo: { type: String },
    waterMeterNo: { type: String },
    
    // Features and amenities
    features: [{ type: String }],
    
    units: [UnitSchema],
    photos: [{ type: String }],
    documents: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model('Property', PropertySchema);


