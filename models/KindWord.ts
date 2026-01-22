import mongoose from 'mongoose';

const KindWordSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  customerName: {
    type: String,
    required: false,
    trim: true,
    default: 'Happy Client',
  },
  imageUrl: {
    type: String,
    default: '',
  },
  imageAlt: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  strict: false, // Allow adding new fields
});

export default mongoose.models.KindWord || mongoose.model('KindWord', KindWordSchema);
