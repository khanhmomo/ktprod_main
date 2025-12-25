import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerGallery from '@/models/CustomerGallery';
import { CustomerFavorite } from '@/models/CustomerGallery';

export async function GET(
  request: NextRequest,
  { params }: { params: { albumCode: string } }
) {
  try {
    await connectDB();
    
    const { albumCode } = await params;
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip');
    const customerIP = realIP || 'unknown';
    
    // Find the gallery
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: 'published',
      isActive: true 
    });
    
    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    // Get all favorites for this gallery and IP
    const favorites = await CustomerFavorite.find({
      galleryId: gallery._id,
      customerIP
    });
    
    // Extract just the photo indices
    const favoriteIndices = favorites.map(fav => fav.photoIndex);
    
    return NextResponse.json({ favorites: favoriteIndices });
  } catch (error) {
    console.error('Error loading favorites:', error);
    return NextResponse.json(
      { error: 'Failed to load favorites' },
      { status: 500 }
    );
  }
}
