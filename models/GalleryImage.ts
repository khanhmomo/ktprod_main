import mongoose, { Document, Schema } from 'mongoose';

export interface IGalleryImage extends Document {
  url: string;
  alt: string;
  category: 'portrait' | 'wedding' | 'event' | 'commercial' | 'other';
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GalleryImageSchema = new Schema<IGalleryImage>(
  {
    url: { type: String, required: true },
    alt: { type: String, required: true },
    category: {
      type: String,
      enum: ['portrait', 'wedding', 'event', 'commercial', 'other'],
      default: 'other',
      required: true,
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Create a compound index for sorting
GalleryImageSchema.index({ isActive: 1, order: 1 });

export default mongoose.models.GalleryImage || 
  mongoose.model<IGalleryImage>('GalleryImage', GalleryImageSchema);
