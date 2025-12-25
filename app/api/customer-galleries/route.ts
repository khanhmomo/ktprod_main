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
    
    return NextResponse.json(gallery, { status: 201 });
  } catch (error) {
    console.error('Error creating customer gallery:', error);
    return NextResponse.json(
      { error: 'Failed to create customer gallery' },
      { status: 500 }
    );
  }
}
