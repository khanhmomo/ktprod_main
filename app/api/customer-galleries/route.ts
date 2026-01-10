import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerGallery from '@/models/CustomerGallery';
import mongoose from 'mongoose';

// GET all customer galleries (for admin list)
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
  console.log('=== CUSTOMER GALLERIES POST START ===');
  
  try {
    console.log('POST request received for customer gallery');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Check if request has valid JSON
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.log('Invalid content type:', contentType);
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }
    
    console.log('Content type validation passed');
    
    await connectDB();
    console.log('Database connected successfully');
    
    console.log('Attempting to read JSON body...');
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
    console.log('Validating required fields...');
    const missingFields = [];
    if (!customerName) missingFields.push('customerName');
    if (!customerEmail) missingFields.push('customerEmail');
    if (!eventDate) missingFields.push('eventDate');
    if (!eventType) missingFields.push('eventType');
    if (!title) missingFields.push('title');
    
    if (missingFields.length > 0) {
      console.log('Validation failed - missing required fields:', missingFields);
      return NextResponse.json(
        { error: 'Missing required fields: ' + missingFields.join(', ') },
        { status: 400 }
      );
    }
    
    console.log('All required fields present');

    // Generate album code manually if not provided
    let albumCode = body.albumCode;
    if (!albumCode) {
      albumCode = Math.random().toString(36).substring(2, 10).toLowerCase();
    }

    console.log('Validation passed, creating gallery...');
    
    // Create new gallery
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
      faceRecognitionEnabled: faceRecognitionEnabled !== false, // Default to true unless explicitly false
      // Initialize face indexing
      faceIndexing: {
        status: 'not_started',
        indexedPhotos: 0,
        totalPhotos: photos?.length || 0,
        lastIndexedAt: null,
        errorMessage: ''
      }
    });

    console.log('Gallery object created, attempting to save...');
    await gallery.save();
    console.log('Gallery saved successfully:', gallery.albumCode);
    
    // Auto-indexing removed - will be handled by home server app
    
    console.log('Creating final response...');
    const responseData = { 
      gallery, 
      redirect: '/admin/customer-galleries/list'
    };
    console.log('Response data:', responseData);
    
    const response = NextResponse.json(responseData, { status: 201 });
    console.log('Response created successfully');
    console.log('=== CUSTOMER GALLERIES POST SUCCESS ===');
    
    return response;
  } catch (error) {
    console.error('Error creating customer gallery:', error);
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Ensure we always return JSON
    try {
      return NextResponse.json(
        { 
          error: 'Failed to create customer gallery: ' + (error instanceof Error ? error.message : 'Unknown error'),
          details: error instanceof Error ? error.name : 'Unknown error'
        },
        { status: 500 }
      );
    } catch (jsonError) {
      console.error('Failed to create JSON response:', jsonError);
      // Last resort - return plain text response
      return new NextResponse('Failed to create customer gallery', { status: 500 });
    }
  }
}

export async function PUT(request: NextRequest) {
  console.log('=== CUSTOMER GALLERIES PUT START ===');
  
  try {
    console.log('PUT request received for customer gallery');
    console.log('Request URL:', request.url);
    
    await connectDB();
    console.log('Database connected successfully');
    
    // Extract ID from URL path - handle both /api/customer-galleries/[id] and ?id= format
    const url = new URL(request.url);
    const pathname = url.pathname;
    const queryId = url.searchParams.get('id');
    
    console.log('Pathname:', pathname);
    console.log('Query ID:', queryId);
    
    // Try to extract ID from pathname first (e.g., /api/customer-galleries/696205b290f02498f3392578)
    let id = null;
    const pathSegments = pathname.split('/');
    if (pathSegments.length > 3 && pathSegments[3]) {
      id = pathSegments[3];
      console.log('Extracted ID from pathname:', id);
    } else if (queryId) {
      id = queryId;
      console.log('Using ID from query parameter:', id);
    }
    
    if (!id) {
      console.log('No ID found in URL');
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Reading request body...');
    const body = await request.json();
    console.log('Request body:', body);
    
    console.log('Updating gallery with ID:', id);
    const gallery = await CustomerGallery.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!gallery) {
      console.log('Gallery not found:', id);
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    console.log('Gallery updated successfully:', gallery.albumCode);
    console.log('=== CUSTOMER GALLERIES PUT SUCCESS ===');
    
    return NextResponse.json(gallery);
  } catch (error) {
    console.error('Error updating gallery:', error);
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('=== CUSTOMER GALLERIES PUT FAILED ===');
    
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
