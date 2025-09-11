import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const albumSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    required: true
  },
  images: [imageSchema],
  date: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  featuredInHero: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['Wedding', 'Prewedding', 'Event', 'Studio'],
    required: true,
    default: 'Event'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
albumSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Album || mongoose.model('Album', albumSchema);
