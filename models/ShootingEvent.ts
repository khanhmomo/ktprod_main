import mongoose, { Schema, Document } from 'mongoose';

interface IShootingEvent extends Document {
  title: string;
  date: Date;
  time: string;
  inquiryId?: string;
  bookingIds: string[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'edited' | 'sent-to-customer' | 'cancelled';
  notes?: string;
  location?: string;
  duration?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  packageType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const shootingEventSchema = new Schema<IShootingEvent>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  inquiryId: {
    type: Schema.Types.ObjectId,
    ref: 'Inquiry',
    default: null
  },
  bookingIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    default: []
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'edited', 'sent-to-customer', 'cancelled'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    default: ''
  },
  customerName: {
    type: String,
    default: ''
  },
  customerEmail: {
    type: String,
    default: ''
  },
  customerPhone: {
    type: String,
    default: ''
  },
  packageType: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Update the updatedAt field on save
shootingEventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.ShootingEvent || mongoose.model<IShootingEvent>('ShootingEvent', shootingEventSchema);
