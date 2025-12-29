import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerGallery from '@/models/CustomerGallery';

export async function GET(request: NextRequest, { params }: { params: { slug: string[] } }) {
  // This will handle GET requests for dynamic routes if needed
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT(request: NextRequest, { params }: { params: { slug: string[] } }) {
  try {
    await connectDB();
    
    // Extract ID from slug array
    const id = params.slug[0];
    
    if (!id) {
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    console.log('Updating gallery with ID:', id, 'Data:', body);
    
    // Find and update the gallery
    const gallery = await CustomerGallery.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!gallery) {
      console.log('Gallery not found for update:', id);
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    console.log('Gallery updated successfully:', gallery.albumCode);
    
    // Return response first
    const response = NextResponse.json(gallery);
    
    // Start background face indexing AFTER response (async)
    if (body.status === 'published' && gallery.photos && gallery.photos.length > 0) {
      console.log('Starting background face indexing for published gallery:', gallery.albumCode);
      
      // Trigger background job asynchronously (don't wait)
      setTimeout(() => {
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/background-jobs/index-faces`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ albumCode: gallery.albumCode })
        }).catch(error => {
          console.error('Failed to start background indexing:', error);
        });
      }, 0);
    }
    
    return response;
    
  } catch (error) {
    console.error('Error updating gallery:', error);
    return NextResponse.json(
      { error: 'Failed to update gallery' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string[] } }) {
  try {
    await connectDB();
    
    // Extract ID from slug array
    const id = params.slug[0];
    
    if (!id) {
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Deleting gallery with ID:', id);
    
    // Find gallery first to get album code for AWS cleanup
    const gallery = await CustomerGallery.findById(id);
    
    if (!gallery) {
      console.log('Gallery not found for deletion:', id);
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    const albumCode = gallery.albumCode;
    
    // Delete the gallery from database
    await CustomerGallery.findByIdAndDelete(id);
    
    // Clean up AWS Rekognition collection
    try {
      const { FaceCollectionService } = require('@/lib/face-collection');
      const collectionId = `gallery-${albumCode}`;
      await FaceCollectionService.deleteCollection(collectionId);
      console.log(`Deleted AWS collection: ${collectionId}`);
    } catch (awsError) {
      console.log(`AWS collection cleanup failed (may not exist):`, awsError);
      // Don't fail the deletion if AWS cleanup fails
    }
    
    console.log('Gallery deleted successfully:', albumCode);
    
    return NextResponse.json({ 
      message: 'Gallery deleted successfully',
      albumCode 
    });
    
  } catch (error) {
    console.error('Error deleting gallery:', error);
    return NextResponse.json(
      { error: 'Failed to delete gallery' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { slug: string[] } }) {
  try {
    await connectDB();
    
    // Extract albumCode from slug array
    const albumCode = params.slug[0];
    
    if (!albumCode) {
      return NextResponse.json(
        { error: 'Album code is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { status, indexedPhotos, totalPhotos } = body;
    
    console.log(`Updating gallery status for ${albumCode}:`, { status, indexedPhotos, totalPhotos });
    
    // Find and update the gallery by albumCode
    const gallery = await CustomerGallery.findOneAndUpdate(
      { albumCode: albumCode.toLowerCase() },
      { 
        $set: {
          'faceIndexing.status': status,
          'faceIndexing.indexedPhotos': indexedPhotos,
          'faceIndexing.totalPhotos': totalPhotos,
          'faceIndexing.lastUpdated': new Date(),
          'faceIndexing.isReadyToSend': status === 'completed' && indexedPhotos > 0
        }
      },
      { new: true, upsert: false }
    );
    
    if (!gallery) {
      console.log(`Gallery not found for album code: ${albumCode}`);
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    console.log(`Gallery status updated successfully: ${albumCode}`);
    
    return NextResponse.json({ 
      message: 'Gallery status updated successfully',
      albumCode,
      status,
      indexedPhotos,
      totalPhotos
    });
    
  } catch (error) {
    console.error('Error updating gallery status:', error);
    return NextResponse.json(
      { error: 'Failed to update gallery status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { slug: string[] } }) {
  // This will handle POST requests for dynamic routes if needed
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
