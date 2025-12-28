import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CustomerGallery from '@/models/CustomerGallery';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumCode: string }> }
) {
  try {
    const { albumCode } = await params;
    
    // Connect to database
    await dbConnect();
    
    // Find gallery by album code
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: { $in: ['published', 'draft'] },
      isActive: true 
    }).select('-customerFavorites'); // Exclude favorites for performance

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    // Return gallery data
    return NextResponse.json({
      success: true,
      gallery: {
        _id: gallery._id,
        title: gallery.title,
        customerName: gallery.customerName,
        eventType: gallery.eventType,
        albumCode: gallery.albumCode,
        coverPhotoUrl: gallery.coverPhotoUrl,
        photos: gallery.photos,
        createdAt: gallery.createdAt,
        status: gallery.status,
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
