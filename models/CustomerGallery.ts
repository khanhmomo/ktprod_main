import mongoose from 'mongoose';

const PhotoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  driveFileId: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  }
});

const CustomerGallerySchema = new mongoose.Schema({
  albumCode: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  title: {
    type: String,
    required: false,
    default: ''
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  eventType: {
    type: String,
    required: true
  },
  coverPhotoUrl: {
    type: String,
    default: ''
  },
  photos: [PhotoSchema],
  driveFolderId: {
    type: String,
    required: true
  },
  driveFolderUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  deliveryDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  // Customer favorites tracking
  customerFavorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerFavorite'
  }],
  // Global favorites shared by all users
  globalFavorites: {
    type: [Number],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Face recognition settings
  faceRecognitionEnabled: {
    type: Boolean,
    default: false // Default to false for new galleries
  },
  // Face indexing status
  faceIndexing: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'failed'],
      default: 'not_started'
    },
    totalPhotos: {
      type: Number,
      default: 0
    },
    indexedPhotos: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    estimatedTimeRemaining: {
      type: Number,
      default: 0 // in minutes
    },
    isReadyToSend: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Generate unique album code before saving
CustomerGallerySchema.pre('save', async function(next) {
  if (this.isNew && !this.albumCode) {
    let code: string;
    let exists = true;
    
    // Generate unique 8-character code
    while (exists) {
      code = Math.random().toString(36).substring(2, 10).toLowerCase();
      exists = await (this.constructor as any).findOne({ albumCode: code });
    }
    
    this.albumCode = code!;
  }
  next();
});

export default mongoose.models.CustomerGallery || mongoose.model('CustomerGallery', CustomerGallerySchema);

// Customer favorite model
const CustomerFavoriteSchema = new mongoose.Schema({
  galleryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerGallery',
    required: true
  },
  photoIndex: {
    type: Number,
    required: true
  },
  customerIP: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const CustomerFavorite = mongoose.models.CustomerFavorite || mongoose.model('CustomerFavorite', CustomerFavoriteSchema);
