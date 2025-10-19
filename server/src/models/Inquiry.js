import mongoose from 'mongoose';

const InquirySchema = new mongoose.Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    status: { type: String, enum: ['open', 'archived'], default: 'open' },
    lastActivityAt: { type: Date, default: Date.now },
    buyerUnreadCount: { type: Number, default: 0 },
    ownerUnreadCount: { type: Number, default: 0 },
    buyerLastReadAt: { type: Date },
    ownerLastReadAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Inquiry', InquirySchema);
