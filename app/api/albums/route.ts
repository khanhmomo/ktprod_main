import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import mongoose from 'mongoose';

// Delete the cached model to force schema reload
if (mongoose.models.Album) {
  delete mongoose.models.Album;
}

// Import fresh Album model
const Album = require('@/models/Album').default || mongoose.model('Album');

interface ImageObject {
  url: string;
  alt?: string;
  originalUrl?: string;
  source?: 'upload' | 'google-drive';
}

export async function GET(request: Request) {
  console.log('GET /api/albums called');
  
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const category = searchParams.get('category');
    
    // For non-admin requests, don't require authentication
    if (!all) {
      try {
        await dbConnect();
        const query: any = { isPublished: true };
        
        if (category) {
          // Try multiple formats for category matching
          const formattedCategory = category
            .split('-') // Split by hyphens
            .map(word => word.toUpperCase()) // Convert each word to uppercase
            .join(' '); // Join with spaces
          
          const titleCaseCategory = category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          
          const lowerCaseCategory = category.toLowerCase();
          
          // Check multiple possible formats
          query.$or = [
            { category: formattedCategory }, // BABY
            { category: titleCaseCategory }, // Baby
            { category: lowerCaseCategory }, // baby
            { category: category }, // baby (as is)
          ];
        }
        
        const albums = await Album.find(query).sort({ createdAt: -1 });
        return NextResponse.json(albums, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        });
      } catch (error) {
        console.error('Error fetching public albums:', error);
        return NextResponse.json(
          { error: 'Failed to fetch albums' },
          { status: 500 }
        );
      }
    }
    
    // For admin requests, require authentication
    const authResponse = await fetch(`${new URL(request.url).origin}/api/auth/check`, {
      headers: request.headers
    });
    
    if (!authResponse.ok) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Admin is authenticated, fetch albums with optional category filter
    await dbConnect();
    
    console.log('🔍 Admin API - Category parameter:', category);
    
    let query = {};
    
    // Apply category filter if provided
    if (category) {
      console.log('🔍 Admin API - Applying category filter for:', category);
      // Try multiple formats for category matching
      const formattedCategory = category
        .split('-') // Split by hyphens
        .map(word => word.toUpperCase()) // Convert each word to uppercase
        .join(' '); // Join with spaces
      
      const titleCaseCategory = category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      const lowerCaseCategory = category.toLowerCase();
      
      // Check multiple possible formats
      query = {
        $or: [
          { category: formattedCategory }, // BABY
          { category: titleCaseCategory }, // Baby
          { category: lowerCaseCategory }, // baby
          { category: category }, // baby (as is)
        ]
      };
    }
    
    console.log('🔍 Admin API - Final query:', JSON.stringify(query, null, 2));
    
    const albums = await Album.find(query, 'title coverImage isPublished createdAt images category').sort({ createdAt: -1 });
    
    console.log('🔍 Admin API - Albums found:', albums.length);
    
    return NextResponse.json(albums, {
      headers: {
        'Access-Control-Allow-Origin': new URL(request.url).origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error in GET /api/albums:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch albums',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    } else {
      console.error('Unknown error occurred in GET /api/albums');
      return NextResponse.json(
        { error: 'An unknown error occurred' },
        { status: 500 }
      );
    }
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function POST(request: Request) {
  try {
    // First verify the user is authenticated
    const authResponse = await fetch(`${new URL(request.url).origin}/api/auth/check`, {
      headers: request.headers
    });
    
    if (!authResponse.ok) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': new URL(request.url).origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    await dbConnect();
    const data = await request.json();
    
    console.log('Creating new album with data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': new URL(request.url).origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    if (!Array.isArray(data.images) || data.images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': new URL(request.url).origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    // Generate a URL-friendly slug from the title
    const slug = data.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove all non-word chars except spaces and hyphens
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/--+/g, '-');     // Replace multiple hyphens with a single one

    // Process images - add source information
    const processedImages = data.images.map((img: ImageObject) => ({
      url: img.url,
      alt: img.alt || '',
      originalUrl: img.originalUrl || img.url,
      source: img.originalUrl?.includes('drive.google.com') ? 'google-drive' : 'upload'
    }));

    // Validate category - accept any category name since categories are now dynamic
    const category = data.category || 'EVENT';

    // Ensure cover image is set
    const coverImage = data.coverImage || (processedImages[0]?.url || '');
    if (!coverImage) {
      return NextResponse.json(
        { error: 'Cover image is required' },
        { status: 400 }
      );
    }

    const album = new Album({
      title: data.title,
      slug,
      description: data.description || '',
      coverImage,
      images: processedImages,
      date: data.date || new Date(),
      location: data.location || '',
      isPublished: Boolean(data.isPublished),
      featuredInHero: Boolean(data.featuredInHero),
      category,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedAlbum = await album.save();
    console.log('Album created successfully:', savedAlbum._id);
    
    return NextResponse.json(savedAlbum, { 
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': new URL(request.url).origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: unknown) {
    // Type guard for MongoDB/Mongoose errors
    const isMongoError = (error: unknown): error is { code?: number; keyPattern?: Record<string, any>; keyValue?: Record<string, any> } => {
      return typeof error === 'object' && error !== null;
    };

    // Type guard for validation errors
    const isValidationError = (error: unknown): error is { name: string; errors?: Record<string, { message: string }>; message: string } => {
      return typeof error === 'object' && error !== null && 'name' in error;
    };

    // Type guard for Error objects
    const isError = (error: unknown): error is Error => {
      return error instanceof Error;
    };

    // Log error details
    console.error('Error creating album:');
    if (isMongoError(err)) {
      console.error('MongoDB Error:', {
        code: err.code,
        keyPattern: err.keyPattern,
        keyValue: err.keyValue
      });
    }
    if (isError(err)) {
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
    }
    
    // Handle duplicate key errors
    if (isMongoError(err) && err.code === 11000) {
      const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'unknown';
      const value = err.keyValue ? Object.values(err.keyValue)[0] : '';
      
      return NextResponse.json(
        { 
          success: false,
          error: 'An album with this title already exists',
          field,
          value
        },
        { status: 400 }
      );
    }
    
    // Handle validation errors
    if (isValidationError(err) && err.name === 'ValidationError') {
      const details = err.errors 
        ? Object.values(err.errors).map(e => e.message) 
        : [err.message];
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation error',
          details
        },
        { status: 400 }
      );
    }
    
    // Generic error response
    const errorMessage = isError(err) ? err.message : 'Unknown error';
    const errorStack = isError(err) ? err.stack : undefined;
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create album',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && errorStack && { stack: errorStack })
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}
