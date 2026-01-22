import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
  caseId: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  source: 'email' | 'live_chat' | 'phone' | 'in_person' | 'other';
  repliedAt?: Date;
  replyNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema: Schema = new Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'replied'],
    default: 'unread',
    required: true,
  },
  source: {
    type: String,
    enum: ['email', 'live_chat', 'phone', 'in_person', 'other'],
    default: 'email',
    required: true,
  },
    repliedAt: {
    type: Date
  },
  replyNote: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index for efficient sorting
InquirySchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Inquiry || mongoose.model<IInquiry>('Inquiry', InquirySchema);
