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

export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  const { id } = context.params;
  const requestId = Math.random().toString(36).substring(2, 9);
  
  console.log(`[${requestId}] Updating album with ID: ${id}`);
  
  try {
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

    await dbConnect();
    
    // Parse request body
    const updateData = await request.json();
    console.log(`[${requestId}] Update data:`, updateData);
    
    // Only allow specific fields to be updated
    const allowedUpdates = ['isPublished', 'title', 'description', 'date', 'location'];
    const updates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as Record<string, any>);
    
    // Add updatedAt timestamp
    updates.updatedAt = new Date();
    
    const updatedAlbum = await Album.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!updatedAlbum) {
      console.error(`[${requestId}] Album not found with ID: ${id}`);
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
    
    console.log(`[${requestId}] Successfully updated album:`, updatedAlbum._id);
    
    return NextResponse.json(
      { 
        success: true,
        data: updatedAlbum,
        requestId 
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
    
  } catch (error) {
    console.error(`[${requestId}] Error updating album:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update album',
        requestId
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

// Export other HTTP methods
export { DELETE } from './DELETE';
