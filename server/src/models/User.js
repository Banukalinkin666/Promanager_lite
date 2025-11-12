import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'OWNER', 'TENANT'], required: true },
    
    // Detailed tenant information (for TENANT role)
    firstName: { type: String, required: function() { return this.role === 'TENANT'; } },
    lastName: { type: String, required: function() { return this.role === 'TENANT'; } },
    middleName: { type: String },
    passportNo: { type: String },
    nic: { type: String, required: function() { return this.role === 'TENANT'; } },
    nicExpirationDate: { type: Date },
    primaryEmail: { type: String, required: function() { return this.role === 'TENANT'; } },
    phone: { type: String, required: function() { return this.role === 'TENANT'; } },
    nationality: { type: String },
    
    // Additional contact information
    secondaryEmail: { type: String },
    secondaryPhone: { type: String },
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    
    // Address information
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String }
    },
    
    // Employment information
    employment: {
      company: { type: String },
      position: { type: String },
      monthlyIncome: { type: Number },
      employmentType: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'STUDENT', 'UNEMPLOYED'] }
    },
    
    // Additional notes
    notes: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'BLACKLISTED'], default: 'ACTIVE' },
    isActive: { type: Boolean, default: true },
    
    // Block/Blacklist information
    blockReason: { type: String },
    blockedAt: { type: Date },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export default mongoose.model('User', UserSchema);


