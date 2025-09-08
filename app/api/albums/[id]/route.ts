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
  const requestId = Math.random().toString(36).substring(2, 9);
  
  console.log(`[${requestId}] Fetching album with ID: ${id}`);
  
  // Validate ID format
  if (!id || typeof id !== 'string' || id.length !== 24) {
    console.error(`[${requestId}] Invalid album ID format: ${id}`);
    return NextResponse.json(
      { 
        success: false,
        error: 'Invalid album ID format',
        requestId
      },
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
  
  try {
    console.log(`[${requestId}] Connecting to database...`);
    await dbConnect();
    
    console.log(`[${requestId}] Querying album with ID: ${id}`);
    const album = await Album.findOne({ _id: id, isPublished: true })
      .select('-__v')
      .lean<AlbumDocument>()
      .maxTimeMS(5000) // 5 second timeout for the query
      .exec();
    
    if (!album) {
      console.log(`[${requestId}] Album with ID ${id} not found or not published`);
      return NextResponse.json(
        { 
          success: false,
          error: 'Album not found',
          requestId
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
    
    // Format the response
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL 
                     ? `https://${process.env.VERCEL_URL}` 
                     : 'http://localhost:3000');
    
    console.log(`[${requestId}] Using base URL: ${baseUrl}`);
    const formattedAlbum = {
      ...album,
      images: (album.images || []).map(img => ({
        ...img,
        url: img.url?.startsWith('http') 
          ? img.url 
          : img.url?.startsWith('/') 
            ? `${baseUrl}${img.url}`
            : img.url || '',
        alt: img.alt || ''
      }))
    };
    
    // Log success
    console.log(`[${requestId}] Successfully retrieved album: ${album._id}`);
    
    return NextResponse.json(
      { 
        success: true,
        data: formattedAlbum,
        requestId
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      }
    );
    
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        requestId,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
}

// Export other HTTP methods if needed
// Uncomment and implement these when the corresponding route handlers are created
// export { PUT } from './[id]/PUT';
// export { PATCH } from './[id]/PATCH';
// export { DELETE } from './[id]/DELETE';
