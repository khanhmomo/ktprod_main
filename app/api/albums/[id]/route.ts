import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import mongoose from 'mongoose';

// Delete the cached model to force schema reload
if (mongoose.models.Album) {
  delete mongoose.models.Album;
}

// Import fresh Album model
const Album = require('@/models/Album').default || mongoose.model('Album');

interface AlbumImage {
  url: string;
  alt?: string;
}

interface AlbumDocument {
  _id: string | any; // Allow both string and ObjectId
  title: string;
  images: AlbumImage[];
  date: string | Date;
  location: string;
  description?: string;
  isPublished: boolean;
  category: string;
  coverImage: string;
  updatedAt: Date;
  createdAt: Date;
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
      .lean()
      .maxTimeMS(5000) // 5 second timeout for the query
      .exec() as AlbumDocument | null;
    
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
      images: (album.images || []).map((img: any) => ({
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
    console.log(`[${requestId}] Raw update data:`, JSON.stringify(updateData, null, 2));
    console.log(`[${requestId}] Request headers:`, Object.fromEntries(request.headers.entries()));
    
    // Only allow specific fields to be updated
    const allowedUpdates = ['isPublished', 'title', 'description', 'date', 'location', 'category', 'coverImage'];
    console.log(`[${requestId}] Raw update data:`, JSON.stringify(updateData, null, 2));
    
    // Log each field in the update data
    console.log(`[${requestId}] Fields in update data:`, Object.keys(updateData));
    console.log(`[${requestId}] Category in update data (raw):`, updateData.category);
    console.log(`[${requestId}] Category type:`, typeof updateData.category);
    
    const updates = Object.keys(updateData)
      .filter(key => {
        const isAllowed = allowedUpdates.includes(key);
        console.log(`[${requestId}] Checking key '${key}': ${isAllowed ? 'allowed' : 'not allowed'}`);
        return isAllowed;
      })
      .reduce((obj, key) => {
        console.log(`[${requestId}] Adding '${key}' to updates:`, updateData[key]);
        // Ensure the value is properly set (not undefined or null)
        if (updateData[key] !== undefined && updateData[key] !== null) {
          obj[key] = updateData[key];
        } else {
          console.log(`[${requestId}] Skipping '${key}' because it's ${updateData[key]}`);
        }
        return obj;
      }, {} as Record<string, any>);
      
    console.log(`[${requestId}] Processed updates:`, updates);
    console.log(`[${requestId}] Updates to be applied:`, JSON.stringify(updates, null, 2));
    
    // Add updatedAt timestamp
    updates.updatedAt = new Date();
    
    // Log the final update object
    console.log(`[${requestId}] Final update object:`, JSON.stringify(updates, null, 2));
    
    // Validate category if it's being updated - accept any category name since categories are now dynamic
    if (updates.category) {
      console.log(`[${requestId}] Processing category:`, updates.category);
      
      // Trim whitespace but don't force uppercase - keep the original format
      updates.category = String(updates.category).trim();
      
      // Basic validation - ensure it's not empty and is a string
      if (!updates.category || updates.category.length === 0) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Category cannot be empty',
            requestId
          },
          { status: 400 }
        );
      }
      
      console.log(`[${requestId}] Category processed:`, updates.category);
    }
    
    // Log the update operation with detailed information
    console.log(`[${requestId}] === UPDATING ALBUM ===`);
    console.log(`[${requestId}] Album ID: ${id}`);
    console.log(`[${requestId}] All updates:`, JSON.stringify(updates, null, 2));
    console.log(`[${requestId}] Category in updates:`, updates.category);
    console.log(`[${requestId}] Update keys:`, Object.keys(updates));
    
    try {
      // First, verify the album exists and log its current state
      console.log(`[${requestId}] Fetching existing album...`);
      const existingAlbum = await Album.findById(id);
      
      if (!existingAlbum) {
        console.error(`[${requestId}] Album not found with ID: ${id}`);
        return NextResponse.json(
          { 
            success: false,
            error: 'Album not found',
            requestId
          },
          { status: 404 }
        );
      }
      
      console.log(`[${requestId}] Current album data:`, {
        title: existingAlbum.title,
        category: existingAlbum.category,
        lastUpdated: existingAlbum.updatedAt
      });
      
      // Log detailed comparison of current and new data
      console.log(`[${requestId}] === DATA COMPARISON ===`);
      console.log(`[${requestId}] Current album data:`, {
        title: existingAlbum.title,
        category: existingAlbum.category,
        date: existingAlbum.date,
        isPublished: existingAlbum.isPublished,
        location: existingAlbum.location,
        description: existingAlbum.description
      });
      
      console.log(`[${requestId}] Submitted updates:`, updates);
      
      // Log category update specifically
      if (updates.category) {
        console.log(`[${requestId}] Category update: '${existingAlbum.category}' -> '${updates.category}'`);
      } else {
        console.log(`[${requestId}] No category update in this request`);
      }
      
      // Log all fields that will be updated
      const updatedFields = Object.keys(updates).filter(key => 
        JSON.stringify(existingAlbum[key as keyof typeof existingAlbum]) !== 
        JSON.stringify(updates[key])
      );
      
      if (updatedFields.length > 0) {
        console.log(`[${requestId}] Fields being updated:`, updatedFields);
      } else {
        console.log(`[${requestId}] No fields changed (values are the same as current)`);
      }
      
      // Perform the update using findOneAndUpdate for better atomicity
      console.log(`[${requestId}] Executing database update...`);
      
      // Log the final update object
      console.log(`[${requestId}] Executing update with:`, {
        filter: { _id: id },
        update: { $set: updates },
        options: { new: true, runValidators: false }
      });
      
      // Use findOneAndUpdate to ensure atomic updates
      const updatedAlbum = await Album.findOneAndUpdate(
        { _id: id },
        { $set: updates },
        { new: true, runValidators: false }
      ).lean();
      
      if (!updatedAlbum) {
        console.error(`[${requestId}] Album not found with ID: ${id}`);
        throw new Error('Failed to update album: Album not found');
      }
      
      // Type assertion for the updated album
      const albumData = updatedAlbum as unknown as AlbumDocument;
      
      console.log(`[${requestId}] Album updated successfully`);
      console.log(`[${requestId}] Updated album data:`, {
        title: albumData.title,
        category: albumData.category,
        updatedAt: albumData.updatedAt
      });
      
      // Convert _id to string for the response
      const responseAlbum = {
        ...albumData,
        _id: albumData._id.toString(),
      };
      
      // Return the updated album
      return NextResponse.json(
        { 
          success: true,
          data: responseAlbum,
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
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: 'An unexpected error occurred',
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

// Export DELETE method
export async function DELETE(request: NextRequest, context: RouteParams) {
  const { id } = context.params;
  const requestId = Math.random().toString(36).substring(2, 9);
  
  console.log(`[${requestId}] Deleting album with ID: ${id}`);
  
  try {
    await dbConnect();
    const result = await Album.deleteOne({ _id: id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Album not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[${requestId}] Error deleting album:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete album' 
      },
      { status: 500 }
    );
  }
}
