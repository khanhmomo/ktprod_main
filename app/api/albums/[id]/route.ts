import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Album from '@/models/Album';

interface AlbumImage {
  url: string;
  alt?: string;
}

interface AlbumDocument {
  _id: string;
  title: string;
  images: AlbumImage[];
  date: string;
  location: string;
  description?: string;
  isPublished: boolean;
  __v: number;
}

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  const { id } = context.params;
  console.log(`[API] Fetching album with ID: ${id}`);
  
  // Add request ID for better tracing
  const requestId = Math.random().toString(36).substring(2, 9);
  
  try {
    console.log(`[${requestId}] Connecting to database...`);
    
    // Log environment info (without sensitive data)
    console.log(`[${requestId}] Environment: ${process.env.NODE_ENV}`);
    console.log(`[${requestId}] Database: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
    
    try {
      await dbConnect();
      console.log(`[${requestId}] Database connected successfully`);
    } catch (dbError: any) {
      const errorMessage = dbError?.message || 'Unknown database error';
      console.error(`[${requestId}] Database connection error:`, errorMessage);
      
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          requestId,
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      );
    }
    
    console.log(`[${requestId}] Querying album with ID: ${id}`);
    
    // Add query timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    let album;
    try {
      album = await Album.findById(id)
        .lean<AlbumDocument>()
        .maxTimeMS(10000); // 10 second query timeout
        
      clearTimeout(timeout);
    } catch (queryError: any) {
      clearTimeout(timeout);
      console.error(`[${requestId}] Query error:`, queryError);
      
      return NextResponse.json(
        { 
          error: 'Failed to query album',
          details: queryError.message,
          requestId,
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      );
    }
    
    if (!album) {
      console.log(`[${requestId}] Album with ID ${id} not found`);
      return NextResponse.json(
        { 
          success: false,
          error: 'Album not found',
          requestId,
          timestamp: new Date().toISOString()
        },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      );
    }
    
    const albumDoc = album;
    
    // Log detailed info about the album and its images
    const albumInfo = {
      _id: albumDoc._id,
      title: albumDoc.title,
      imageCount: albumDoc.images?.length || 0,
      firstImage: albumDoc.images?.[0] ? {
        url: albumDoc.images[0].url,
        urlType: typeof albumDoc.images[0].url,
        urlStartsWithHttp: albumDoc.images[0].url?.startsWith('http'),
        urlStartsWithSlash: albumDoc.images[0].url?.startsWith('/'),
        alt: albumDoc.images[0].alt
      } : 'No images',
      allImages: albumDoc.images?.map((img: any) => ({
        url: img.url,
        urlType: typeof img.url,
        urlStartsWithHttp: img.url?.startsWith('http'),
        urlStartsWithSlash: img.url?.startsWith('/'),
        alt: img.alt
      }))
    };
    
    console.log('Album details:', JSON.stringify(albumInfo, null, 2));
    
    // Ensure image URLs are properly formatted
    const formattedAlbum = {
      ...album,
      images: album.images?.map(img => ({
        ...img,
        // If URL is relative, prepend the base URL
        url: img.url?.startsWith('http') ? img.url : 
             img.url?.startsWith('/') ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}${img.url}` : 
             img.url
      }))
    };
    
    return NextResponse.json(formattedAlbum);
    
  } catch (error) {
    console.error('Error in GET /api/albums/[id]:', error);
    
    let errorMessage = 'Failed to fetch album';
    let statusCode = 500;
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'CastError') {
        errorMessage = 'Invalid album ID format';
        statusCode = 400;
      } else if (error.name === 'MongoServerError') {
        errorMessage = 'Database error occurred';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: statusCode }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  const { id } = context.params;
  try {
    await dbConnect();
    const data = await request.json();
    
    console.log(`Updating album ${id} with data:`, JSON.stringify(data, null, 2));
    
    // Check if album exists first
    const existingAlbum = await Album.findById(id);
    if (!existingAlbum) {
      console.error(`Album not found: ${id}`);
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }
    
    // Validate required fields
    if (!data.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(data.images) || data.images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData = {
      title: data.title,
      description: data.description || '',
      coverImage: data.coverImage || (data.images[0]?.url || ''),
      images: data.images.map((img: { url: string; alt?: string }) => ({
        url: img.url,
        alt: img.alt || ''
      })),
      date: data.date || new Date(),
      location: data.location || '',
      isPublished: Boolean(data.isPublished),
      featuredInHero: Boolean(data.featuredInHero),
      updatedAt: new Date()
    };
    
    const album = await Album.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!album) {
      console.error(`Failed to update album: ${id}`);
      return NextResponse.json(
        { error: 'Failed to update album' },
        { status: 500 }
      );
    }
    
    console.log(`Successfully updated album: ${id}`);
    return NextResponse.json(album);
  } catch (error) {
    console.error('Error updating album:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to update album: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  const { id } = context.params;
  try {
    await dbConnect();
    const data = await request.json();
    
    console.log(`Updating album status for ${id}:`, JSON.stringify(data, null, 2));
    
    // Only allow updating isPublished field via PATCH
    if (typeof data.isPublished === 'undefined') {
      return NextResponse.json(
        { error: 'isPublished field is required' },
        { status: 400 }
      );
    }
    
    const album = await Album.findByIdAndUpdate(
      id, 
      { 
        isPublished: Boolean(data.isPublished),
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (!album) {
      console.error(`Album not found: ${id}`);
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }
    
    console.log(`Successfully updated album status: ${id} to ${data.isPublished}`);
    return NextResponse.json(album);
  } catch (error) {
    console.error('Error updating album status:', error);
    return NextResponse.json(
      { error: 'Failed to update album status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  const { id } = context.params;
  try {
    await dbConnect();
    const album = await Album.findByIdAndDelete(id);
    
    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    );
  }
}
