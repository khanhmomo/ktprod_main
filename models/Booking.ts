import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  crewId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'uploaded';
  assignedAt: Date;
  respondedAt?: Date;
  notes?: string;
  salary?: string;
  paymentStatus?: 'pending' | 'completed';
}

const bookingSchema = new Schema<IBooking>({
  crewId: {
    type: Schema.Types.ObjectId,
    ref: 'Crew',
    required: true
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'ShootingEvent',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'in_progress', 'completed', 'uploaded'],
    default: 'pending'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  notes: {
    type: String
  },
  salary: {
    type: String,
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Create indexes for better performance
bookingSchema.index({ crewId: 1, status: 1 });
bookingSchema.index({ eventId: 1 });
bookingSchema.index({ status: 1 });

export const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);
