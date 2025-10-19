import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema(
  {
    address: String,
    city: String,
    region: String,
    country: String,
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    type: { type: String, enum: ['apartment', 'house', 'land', 'office', 'other'], default: 'house' },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    areaSqm: { type: Number, default: 0 },
    location: { type: LocationSchema, default: () => ({}) },
    images: { type: [String], default: [] },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['draft', 'pending', 'published'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.model('Property', PropertySchema);
