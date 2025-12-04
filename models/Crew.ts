import mongoose, { Schema, Document } from 'mongoose';

export interface ICrew extends Document {
  googleId?: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'super_admin' | 'crew';
  permissions: string[];
  isActive: boolean;
  phone?: string;
  specialties?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const crewSchema = new Schema<ICrew>({
  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allow multiple null values for unique constraint
    default: null
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['super_admin', 'crew'],
    default: 'crew'
  },
  permissions: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  phone: {
    type: String,
    default: null
  },
  specialties: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for faster lookups
crewSchema.index({ googleId: 1 });
crewSchema.index({ email: 1 });
crewSchema.index({ role: 1 });

// Clear any existing model to force schema refresh
if (mongoose.models.Crew) {
  delete mongoose.models.Crew;
}

export const Crew = mongoose.model<ICrew>('Crew', crewSchema);
