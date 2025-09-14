import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Album from '@/models/Album';

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
          query.category = category.charAt(0).toUpperCase() + category.slice(1);
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
    
    // Admin is authenticated, fetch all albums
    await dbConnect();
    const albums = await Album.find({}).sort({ createdAt: -1 });
    
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

    const album = new Album({
      title: data.title,
      slug,
      description: data.description || '',
      coverImage: data.coverImage || (processedImages[0]?.url || ''),
      images: processedImages,
      date: data.date || new Date(),
      location: data.location || '',
      isPublished: Boolean(data.isPublished),
      featuredInHero: Boolean(data.featuredInHero),
      category: data.category || 'Uncategorized',
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
  } catch (error) {
    console.error('Error creating album:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create album: ${errorMessage}` },
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
