import mongoose, { Schema, Document } from 'mongoose';

interface IAdvertisement extends Document {
  title: string;
  content: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  ctaText: {
    type: String,
    default: null
  },
  ctaLink: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.models.Advertisement || mongoose.model<IAdvertisement>('Advertisement', AdvertisementSchema);
