import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['buyer', 'seller', 'agent', 'admin'], default: 'buyer' },
    status: { type: String, enum: ['active', 'pending', 'rejected'], default: 'active' },
    phone: { type: String },
    address: { type: String },
    profileImageUrl: { type: String },
    // Optional fields for agents/owners
    bio: { type: String },
    linkedin: { type: String },
    telegram: { type: String },
    // For agents: human-friendly code like AG123456
    agentCode: { type: String },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('User', UserSchema);
