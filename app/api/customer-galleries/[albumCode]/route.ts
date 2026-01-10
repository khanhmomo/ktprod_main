import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CustomerGallery from '@/models/CustomerGallery';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumCode: string }> }
) {
  try {
    const { albumCode } = await params;
    
    await dbConnect();
    
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: { $in: ['published', 'draft'] },
      isActive: true 
    }).select('-customerFavorites');

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      gallery: {
        _id: gallery._id,
        title: gallery.title,
        customerName: gallery.customerName,
        customerEmail: gallery.customerEmail,
        eventDate: gallery.eventDate,
        eventType: gallery.eventType,
        albumCode: gallery.albumCode,
        coverPhotoUrl: gallery.coverPhotoUrl,
        photos: gallery.photos,
        driveFolderId: gallery.driveFolderId,
        driveFolderUrl: gallery.driveFolderUrl,
        status: gallery.status,
        deliveryDate: gallery.deliveryDate,
        notes: gallery.notes,
        faceRecognitionEnabled: gallery.faceRecognitionEnabled,
        globalFavorites: gallery.globalFavorites,
        createdAt: gallery.createdAt,
        isActive: gallery.isActive
      }
    });

  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ albumCode: string }> }
) {
  console.log('=== CUSTOMER GALLERIES [ALBUMCODE] PUT START ===');
  
  try {
    const { albumCode } = await params;
    console.log('PUT request received for customer gallery with albumCode:', albumCode);
    console.log('Request URL:', request.url);
    
    await dbConnect();
    console.log('Database connected successfully');
    
    console.log('Reading request body...');
    const body = await request.json();
    console.log('Request body:', body);
    
    // Check if albumCode is actually a MongoDB ObjectId
    let gallery;
    if (albumCode.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Detected MongoDB ObjectId, searching by _id...');
      gallery = await CustomerGallery.findByIdAndUpdate(
        albumCode,
        { ...body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
    } else {
      console.log('Treating as albumCode, searching by albumCode...');
      gallery = await CustomerGallery.findOneAndUpdate(
        { albumCode: albumCode.toLowerCase() },
        { ...body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
    }
    
    if (!gallery) {
      console.log('Gallery not found:', albumCode);
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    console.log('Gallery updated successfully:', gallery.albumCode);
    console.log('=== CUSTOMER GALLERIES [ALBUMCODE] PUT SUCCESS ===');
    
    return NextResponse.json(gallery);
    
  } catch (error) {
    console.error('Error updating gallery:', error);
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('=== CUSTOMER GALLERIES [ALBUMCODE] PUT FAILED ===');
    
    // Ensure we always return JSON
    try {
      return NextResponse.json(
        { 
          error: 'Failed to update gallery: ' + (error instanceof Error ? error.message : 'Unknown error'),
          details: error instanceof Error ? error.name : 'Unknown error'
        },
        { status: 500 }
      );
    } catch (jsonError) {
      console.error('Failed to create JSON response:', jsonError);
      // Last resort - return plain text response
      return new NextResponse('Failed to update gallery', { status: 500 });
    }
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ albumCode: string }> }
) {
  try {
    const { albumCode } = await params;
    const body = await request.json();
    
    await dbConnect();
    
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase() 
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    // Update face indexing status
    if (body.status !== undefined || body.indexedPhotos !== undefined || body.totalPhotos !== undefined) {
      const updateData: any = {};
      
      if (body.status !== undefined) {
        updateData['faceIndexing.status'] = body.status;
        // If status is in_progress, mark that electron app is handling it
        if (body.status === 'in_progress') {
          updateData['faceIndexing.electronApp'] = true;
          updateData['faceIndexing.serverStopped'] = true;
        }
      }
      if (body.indexedPhotos !== undefined) {
        updateData['faceIndexing.indexedPhotos'] = body.indexedPhotos;
      }
      if (body.totalPhotos !== undefined) {
        updateData['faceIndexing.totalPhotos'] = body.totalPhotos;
      }
      
      // Add timestamp if status is being updated
      if (body.status !== undefined) {
        updateData['faceIndexing.lastIndexedAt'] = new Date();
      }

      await CustomerGallery.updateOne(
        { albumCode: albumCode.toLowerCase() },
        { $set: updateData }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Gallery updated successfully'
    });

  } catch (error) {
    console.error('Error updating gallery:', error);
    return NextResponse.json(
      { error: 'Failed to update gallery' },
      { status: 500 }
    );
  }
}
