import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BusinessGallery from '@/models/BusinessGallery';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Return single gallery
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: 'Invalid gallery ID' },
          { status: 400 }
        );
      }
      
      const gallery = await BusinessGallery.findById(id);
      if (!gallery) {
        return NextResponse.json(
          { error: 'Gallery not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(gallery);
    } else {
      // Return all galleries
      const galleries = await BusinessGallery.find({ isActive: true })
        .sort({ createdAt: -1 })
        .select('-faceIndexing'); // Exclude faceIndexing for admin list
      
      return NextResponse.json(galleries);
    }
  } catch (error) {
    console.error('Error fetching business galleries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business galleries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'businessName', 'businessEmail', 'eventDate', 'eventType'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.businessEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Convert eventDate string to Date
    const eventDate = new Date(body.eventDate);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid event date' },
        { status: 400 }
      );
    }
    
    // Generate albumCode before creating gallery to pass validation
    const date = new Date(eventDate);
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const businessName = body.businessName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 8);
    const randomStr = Math.random().toString(36).substring(2, 6);
    const albumCode = `${businessName}${dateStr}${randomStr}`;
    
    // Create business gallery
    const gallery = new BusinessGallery({
      ...body,
      eventDate,
      albumCode, // Add the generated albumCode
      // Face recognition is always enabled for business galleries
      faceRecognitionEnabled: true,
      // Initialize face indexing
      faceIndexing: {
        status: 'not_started',
        indexedPhotos: 0,
        totalPhotos: body.photos?.length || 0,
        lastIndexedAt: null,
        errorMessage: ''
      }
    });

    await gallery.save();

    return NextResponse.json(gallery, { status: 201 });
  } catch (error) {
    console.error('Error creating business gallery:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: 'Album code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create business gallery: ' + (error instanceof Error ? error.message : 'Unknown error') },
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
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid gallery ID' },
        { status: 400 }
      );
    }

    // Convert eventDate string to Date if provided
    if (body.eventDate) {
      const eventDate = new Date(body.eventDate);
      if (isNaN(eventDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid event date' },
          { status: 400 }
        );
      }
      body.eventDate = eventDate;
    }

    // Validate email format if provided
    if (body.businessEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.businessEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Don't allow changing faceRecognitionEnabled for business galleries
    delete body.faceRecognitionEnabled;

    const gallery = await BusinessGallery.findByIdAndUpdate(
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
    console.error('Error updating business gallery:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update business gallery' },
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
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid gallery ID' },
        { status: 400 }
      );
    }
    
    // First try to find the gallery
    const gallery = await BusinessGallery.findById(id);
    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    // Delete the gallery
    const deletedGallery = await BusinessGallery.findByIdAndDelete(id);
    
    if (!deletedGallery) {
      return NextResponse.json(
        { error: 'Gallery not found or already deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Gallery deleted successfully',
      deletedGallery: {
        id: deletedGallery._id,
        albumCode: deletedGallery.albumCode
      }
    });
  } catch (error) {
    console.error('Error deleting business gallery:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to delete gallery: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
