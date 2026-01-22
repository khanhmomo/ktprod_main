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
  order: {
    type: Number,
    default: 0
  }
});

const BusinessGallerySchema = new mongoose.Schema({
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
  businessName: {
    type: String,
    required: true
  },
  businessEmail: {
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
    required: false,
    default: ''
  },
  driveFolderUrl: {
    type: String,
    required: false,
    default: ''
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
  // Business-specific customization
  backgroundColor: {
    type: String,
    default: '#ffffff'
  },
  backgroundImageUrl: {
    type: String,
    default: ''
  },
  backgroundImageId: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Face recognition settings - always enabled for business galleries
  faceRecognitionEnabled: {
    type: Boolean,
    default: true
  },
  // Face indexing status
  faceIndexing: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'error'],
      default: 'not_started'
    },
    indexedPhotos: {
      type: Number,
      default: 0
    },
    totalPhotos: {
      type: Number,
      default: 0
    },
    lastIndexedAt: {
      type: Date,
      default: null
    },
    errorMessage: {
      type: String,
      default: ''
    }
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

// Create album code from business name and event date
BusinessGallerySchema.pre('save', function(next) {
  if (this.isNew && !this.albumCode) {
    const date = new Date(this.eventDate);
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const businessName = this.businessName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 8);
    const randomStr = Math.random().toString(36).substring(2, 6);
    this.albumCode = `${businessName}${dateStr}${randomStr}`;
  }
  this.updatedAt = new Date();
  next();
});

// Update total photos when photos array changes
BusinessGallerySchema.pre('save', function(next) {
  if (this.isModified('photos')) {
    if (!this.faceIndexing) {
      this.faceIndexing = {
        status: 'not_started',
        indexedPhotos: 0,
        totalPhotos: 0,
        lastIndexedAt: null as any,
        errorMessage: ''
      };
    }
    this.faceIndexing.totalPhotos = this.photos.length;
  }
  next();
});

const BusinessGallery = mongoose.models.BusinessGallery || mongoose.model('BusinessGallery', BusinessGallerySchema);

export default BusinessGallery;
