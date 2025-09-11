import { Document } from 'mongoose';

export interface Album extends Document {
  _id: string;
  title: string;
  description?: string;
  coverImage: string;
  images: string[];
  date: Date;
  location?: string;
  category: 'Wedding' | 'Prewedding' | 'Event' | 'Studio';
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  coverImage: string;
  count: number;
}
