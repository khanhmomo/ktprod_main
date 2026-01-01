import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerGallery from '@/models/CustomerGallery';
import mongoose from 'mongoose';

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
    
    const gallery = await CustomerGallery.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(gallery);
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
    console.log('DELETE request received');
    await connectDB();
    console.log('Database connected');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('Extracted ID:', id);
    
    if (!id) {
      console.log('No ID provided');
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      );
    }
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ID format:', id);
      return NextResponse.json(
        { error: 'Invalid gallery ID format' },
        { status: 400 }
      );
    }
    
    console.log('Attempting to delete gallery with ID:', id);
    
    // First try to find the gallery
    const gallery = await CustomerGallery.findById(id);
    if (!gallery) {
      console.log('Gallery not found:', id);
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    console.log('Found gallery:', gallery.albumCode);
    
    // Delete the gallery
    const deletedGallery = await CustomerGallery.findByIdAndDelete(id);
    
    if (!deletedGallery) {
      console.log('Failed to delete gallery, it may have been deleted already');
      return NextResponse.json(
        { error: 'Gallery not found or already deleted' },
        { status: 404 }
      );
    }
    
    console.log('Successfully deleted gallery:', deletedGallery.albumCode);
    
    return NextResponse.json({ 
      message: 'Gallery deleted successfully',
      deletedGallery: {
        id: deletedGallery._id,
        albumCode: deletedGallery.albumCode
      }
    });
  } catch (error) {
    console.error('Error deleting gallery:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to delete gallery: ' + (error instanceof Error ? error.message : 'Unknown error') },
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
      status,
      faceRecognitionEnabled
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
      status: status || 'draft',
      faceRecognitionEnabled: faceRecognitionEnabled !== false // Default to true unless explicitly false
    });

    await gallery.save();
    console.log('Gallery saved successfully:', gallery);
    
    // Start background face indexing only if gallery has photos AND face recognition is enabled
    if (gallery.photos && gallery.photos.length > 0 && gallery.faceRecognitionEnabled) {
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
