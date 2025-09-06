import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import mongoose from 'mongoose';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await dbConnect();
    console.log('Database connected successfully');
    
    // Test if we can access the Album model
    const Album = mongoose.models.Album;
    if (!Album) {
      throw new Error('Album model not found');
    }
    
    // Try to count albums
    const count = await Album.countDocuments({});
    console.log(`Found ${count} albums in the database`);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      albumsCount: count,
      models: Object.keys(mongoose.models)
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
