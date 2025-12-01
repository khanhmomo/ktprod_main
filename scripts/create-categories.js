require('dotenv').config();
const mongoose = require('mongoose');

// Category data matching your existing albums
const categories = [
  {
    name: 'WEDDING DAY',
    slug: 'wedding-day',
    coverImage: '/images/weddingday-cover.jpeg',
    description: 'Beautiful wedding photography captures the magic of your special day',
    order: 0,
    isActive: true
  },
  {
    name: 'TEA CEREMONY',
    slug: 'tea-ceremony', 
    coverImage: '/images/teaceramony-cover.jpg',
    description: 'Traditional tea ceremony photography celebrating cultural heritage',
    order: 1,
    isActive: true
  },
  {
    name: 'PREWEDDING',
    slug: 'prewedding',
    coverImage: '/images/prewedding-cover.jpg', 
    description: 'Romantic prewedding photography sessions before the big day',
    order: 2,
    isActive: true
  },
  {
    name: 'FASHION',
    slug: 'fashion',
    coverImage: '/images/fashion-cover.jpeg',
    description: 'Fashion photography showcasing style and creativity',
    order: 3,
    isActive: true
  },
  {
    name: 'FAMILY',
    slug: 'family',
    coverImage: '/images/family-cover.jpg',
    description: 'Family portraits capturing precious moments together',
    order: 4,
    isActive: true
  },
  {
    name: 'EVENT',
    slug: 'event',
    coverImage: '/images/event-cover.jpeg',
    description: 'Event photography covering special occasions and celebrations',
    order: 5,
    isActive: true
  },
  {
    name: 'MATERNITY',
    slug: 'maternity',
    coverImage: '/images/maternity-cover.jpg',
    description: 'Maternity photography celebrating the journey to parenthood',
    order: 6,
    isActive: true
  }
];

async function createCategories() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing categories
    await mongoose.connection.db.collection('categories').deleteMany({});
    
    // Insert new categories
    const Category = mongoose.model('Category', new mongoose.Schema({
      name: String,
      slug: String,
      coverImage: String,
      description: String,
      order: Number,
      isActive: Boolean,
      createdAt: Date,
      updatedAt: Date
    }));
    
    await Category.insertMany(categories);
    
    console.log('✅ Categories created successfully!');
    console.log('Created categories:', categories.map(c => c.name));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error creating categories:', error);
    process.exit(1);
  }
}

createCategories();
