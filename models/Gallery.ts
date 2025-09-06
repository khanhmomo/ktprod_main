import mongoose, { Document, Schema } from 'mongoose';

export interface IGalleryImage {
  url: string;
  alt?: string;
  order?: number;
}

export interface IGallery extends Document {
  title: string;
  slug: string;
  description?: string;
  coverImage: string;
  images: IGalleryImage[];
  isPublished: boolean;
  publishedAt?: Date;
  order: number;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const GalleryImageSchema = new Schema<IGalleryImage>({
  url: { type: String, required: true },
  alt: { type: String },
  order: { type: Number, default: 0 }
});

const GallerySchema = new Schema<IGallery>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    coverImage: { type: String, required: true },
    images: [GalleryImageSchema],
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    order: { type: Number, default: 0 },
    metadata: {
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }]
    }
  },
  { timestamps: true }
);

// Create text index for search
GallerySchema.index({
  title: 'text',
  description: 'text',
  'metadata.title': 'text',
  'metadata.description': 'text',
  'metadata.keywords': 'text'
});

// Pre-save hook to update publishedAt
GallerySchema.pre<IGallery>('save', function(next) {
  if (this.isModified('isPublished') && this.isPublished) {
    this.publishedAt = new Date();
  }
  next();
});

export default mongoose.models.Gallery || mongoose.model<IGallery>('Gallery', GallerySchema);
