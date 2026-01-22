import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerGallery from '@/models/CustomerGallery';

export async function GET(
  request: NextRequest,
  { params }: { params: { albumCode: string } }
) {
  try {
    await connectDB();
    
    const { albumCode } = await params;
    
    console.log('=== DEBUG: Loading global favorites for album:', albumCode);
    
    // Find the gallery
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: { $in: ['published', 'draft'] },
      isActive: true 
    });
    
    if (!gallery) {
      console.log('=== DEBUG: Gallery not found for albumCode:', albumCode);
      return NextResponse.json(
        { error: 'Gallery not found', debug: { albumCode } },
        { status: 404 }
      );
    }
    
    console.log('=== DEBUG: Gallery found:', gallery._id, 'title:', gallery.title);
    
    // Get global favorites from the gallery document
    const globalFavorites = gallery.globalFavorites || [];
    
    console.log('=== DEBUG: Global favorites from gallery:', globalFavorites);
    
    return NextResponse.json({ 
      favorites: globalFavorites,
      debug: {
        galleryId: gallery._id,
        galleryTitle: gallery.title,
        totalFavorites: globalFavorites.length,
        favoriteIndices: globalFavorites,
        isGlobalFavorites: true
      }
    });
  } catch (error) {
    console.error('=== DEBUG: Error loading global favorites:', error);
    return NextResponse.json(
      { error: 'Failed to load favorites', debug: error },
      { status: 500 }
    );
  }
}
