import mongoose, { Document, Schema } from 'mongoose';

export interface IGalleryCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  coverImage: string;
  isActive: boolean;
  order: number;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const GalleryCategorySchema = new Schema<IGalleryCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    coverImage: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    metadata: {
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }]
    }
  },
  { timestamps: true }
);

// Create a text index for search functionality
GalleryCategorySchema.index({ name: 'text', description: 'text' });

// Create a compound index for sorting
GalleryCategorySchema.index({ order: 1, createdAt: -1 });

export default mongoose.models.GalleryCategory || 
  mongoose.model<IGalleryCategory>('GalleryCategory', GalleryCategorySchema);
