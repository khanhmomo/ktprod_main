import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerGallery from '@/models/CustomerGallery';

export async function GET() {
  try {
    await connectDB();
    
    const galleries = await CustomerGallery.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('-customerFavorites'); // Exclude favorites for admin list
    
    return NextResponse.json(galleries);
  } catch (error) {
    console.error('Error fetching customer galleries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer galleries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('POST request body:', body);
    
    const {
      title,
      customerName,
      customerEmail,
      eventDate,
      eventType,
      driveFolderId,
      driveFolderUrl,
      notes,
      coverPhotoUrl,
      photos,
      status
    } = body;

    console.log('Extracted fields:', {
      title,
      customerName,
      customerEmail,
      eventDate,
      eventType,
      driveFolderId,
      driveFolderUrl,
      notes,
      coverPhotoUrl,
      photos: photos?.length || 0,
      status
    });

    // Validate required fields
    if (!customerName || !customerEmail || !eventDate || !eventType) {
      console.log('Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate album code manually if not provided
    let albumCode = body.albumCode;
    if (!albumCode) {
      albumCode = Math.random().toString(36).substring(2, 10).toLowerCase();
    }

    console.log('Validation passed, creating gallery...');
    
    // Create new gallery
    console.log('Creating gallery with data:', {
      albumCode,
      title,
      customerName,
      customerEmail,
      eventDate,
      eventType,
      driveFolderId,
      driveFolderUrl,
      notes,
      coverPhotoUrl,
      photos: photos?.length || 0,
      status
    });

    const gallery = new CustomerGallery({
      albumCode,
      title,
      customerName,
      customerEmail,
      eventDate: new Date(eventDate),
      eventType,
      driveFolderId: driveFolderId || '',
      driveFolderUrl: driveFolderUrl || `https://drive.google.com/drive/folders/${driveFolderId}`,
      notes: notes || '',
      coverPhotoUrl: coverPhotoUrl || '',
      photos: photos || [],
      status: status || 'draft'
    });

    await gallery.save();
    console.log('Gallery saved successfully:', gallery);
    
    // Start background face indexing if gallery has photos (regardless of status)
    if (gallery.photos && gallery.photos.length > 0) {
      console.log('Starting background face indexing for gallery:', gallery.albumCode);
      
      // Always use the production URL for thewildstudio.org
      const indexingUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/background-jobs/index-faces`;
      console.log('Triggering indexing at URL:', indexingUrl);
      console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
      
      // Fire and forget - don't await this
      fetch(indexingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumCode: gallery.albumCode })
      }).then(response => {
        console.log('Indexing trigger response status:', response.status);
        return response.text();
      }).then(text => {
        console.log('Indexing trigger response:', text);
      }).catch(error => {
        console.error('Failed to start background indexing:', error);
      });
      
      console.log('Indexing triggered - returning immediately');
    } else {
      console.log('No photos to index for gallery:', gallery.albumCode);
    }
    
    return NextResponse.json({ 
      gallery, 
      redirect: '/admin/customer-galleries/list'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer gallery:', error);
    return NextResponse.json(
      { error: 'Failed to create customer gallery' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      );
    }
    
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

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Deleting gallery with ID:', id);
    
    // Find and delete the gallery
    const gallery = await CustomerGallery.findByIdAndDelete(id);
    
    if (!gallery) {
      console.log('Gallery not found for deletion:', id);
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    console.log('Gallery deleted successfully:', gallery.albumCode);
    
    // Clean up AWS Rekognition collection
    try {
      const collectionId = `gallery-${gallery.albumCode}`;
      console.log('Cleaning up AWS collection:', collectionId);
      
      const { FaceCollectionService } = require('@/lib/face-collection');
      await FaceCollectionService.deleteCollection(collectionId);
      console.log('AWS collection deleted successfully:', collectionId);
      
      // Also clean up any related face search data if needed
      console.log('AWS cleanup completed for album:', gallery.albumCode);
      
    } catch (awsError) {
      console.log('AWS collection cleanup failed (may not exist):', awsError);
      // Don't fail the delete if AWS cleanup fails
    }
    
    return NextResponse.json(
      { message: 'Gallery deleted successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error deleting gallery:', error);
    return NextResponse.json(
      { error: 'Failed to delete gallery' },
      { status: 500 }
    );
  }
}
