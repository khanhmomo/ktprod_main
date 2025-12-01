import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: string;
  published: boolean;
  publishedAt: Date;
  date: Date;
  location: string;
  updatedAt: Date;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
}

const BlogPostSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  excerpt: {
    type: String,
    required: false,
  },
  content: {
    type: String,
    required: true,
  },
  featuredImage: {
    type: String,
    required: false,
  },
  author: {
    type: String,
    required: true,
    default: 'Admin',
  },
  published: {
    type: Boolean,
    default: false,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  date: {
    type: Date,
    default: Date.now,
    required: false,
  },
  location: {
    type: String,
    required: false,
    trim: true,
    default: '',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  metaTitle: {
    type: String,
    trim: true,
  },
  metaDescription: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Update the updatedAt field before saving
BlogPostSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create text index for search
BlogPostSchema.index({
  title: 'text',
  excerpt: 'text',
  content: 'text',
  tags: 'text',
});

// Check if the model has already been compiled
const BlogPost = mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);

export default BlogPost;
