import mongoose, { Schema, Document } from 'mongoose';

export interface IShowcase extends Document {
  imageUrl: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const showcaseSchema = new Schema<IShowcase>({
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for ordering
showcaseSchema.index({ order: 1, isActive: -1 });

// Clear any existing model to force schema refresh
if (mongoose.models.Showcase) {
  delete mongoose.models.Showcase;
}

export const Showcase = mongoose.model<IShowcase>('Showcase', showcaseSchema);
export default Showcase;
