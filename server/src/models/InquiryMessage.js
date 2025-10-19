import mongoose from 'mongoose';

const InquiryMessageSchema = new mongoose.Schema(
  {
    inquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inquiry', required: true },
    sender: { type: String, enum: ['buyer', 'owner'], required: true },
    text: { type: String, default: '' },
    attachments: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('InquiryMessage', InquiryMessageSchema);
