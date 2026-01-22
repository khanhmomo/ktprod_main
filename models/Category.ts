import mongoose from 'mongoose';

interface ICategory {
  name: string;
  slug: string;
  coverImage: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const CategorySchema = new mongoose.Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true
  },
  coverImage: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

// Create compound index for order and isActive to ensure proper sorting
CategorySchema.index({ order: 1, isActive: -1 });

export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
export type { ICategory };
