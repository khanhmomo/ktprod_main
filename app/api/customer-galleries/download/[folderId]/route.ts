import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerGallery from '@/models/CustomerGallery';

export async function GET(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const { folderId } = await params;
    
    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    // Find gallery by driveFolderId
    await connectDB();
    const gallery = await CustomerGallery.findOne({ 
      driveFolderId: folderId,
      isActive: true 
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    if (!gallery.photos || gallery.photos.length === 0) {
      return NextResponse.json(
        { error: 'No photos found in gallery' },
        { status: 404 }
      );
    }

    // Redirect to Google Drive folder for ZIP download
    const googleDriveUrl = `https://drive.google.com/drive/folders/${folderId}`;
    
    return NextResponse.redirect(googleDriveUrl);

  } catch (error) {
    console.error('Error setting up download:', error);
    return NextResponse.json(
      { error: 'Failed to setup download' },
      { status: 500 }
    );
  }
}
