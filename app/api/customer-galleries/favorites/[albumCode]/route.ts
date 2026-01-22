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
    
    console.log('Loading global favorites for album:', albumCode);
    
    // Find the gallery
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: { $in: ['published', 'draft'] },
      isActive: true 
    });
    
    if (!gallery) {
      console.log('Gallery not found for albumCode:', albumCode);
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    // Return global favorites stored in the gallery document
    const globalFavorites = gallery.globalFavorites || [];
    
    console.log('Found global favorites:', globalFavorites);
    
    return NextResponse.json({ favorites: globalFavorites });
  } catch (error) {
    console.error('Error loading global favorites:', error);
    return NextResponse.json(
      { error: 'Failed to load favorites' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { albumCode: string } }
) {
  try {
    await connectDB();
    
    const { albumCode } = await params;
    const { photoIndex } = await request.json();
    
    console.log('Toggle global favorite for album:', albumCode, 'photoIndex:', photoIndex);
    
    // Find the gallery
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: { $in: ['published', 'draft'] },
      isActive: true 
    });
    
    if (!gallery) {
      console.log('Gallery not found for albumCode:', albumCode);
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    // Initialize globalFavorites array if it doesn't exist
    if (!gallery.globalFavorites) {
      gallery.globalFavorites = [];
    }
    
    // Check if photo is already in favorites
    const favoriteIndex = gallery.globalFavorites.indexOf(photoIndex);
    let action;
    
    if (favoriteIndex === -1) {
      // Add to favorites
      gallery.globalFavorites.push(photoIndex);
      gallery.globalFavorites.sort((a: number, b: number) => a - b); // Keep sorted
      action = 'added';
      console.log('Global favorite added for photo:', photoIndex);
    } else {
      // Remove from favorites
      gallery.globalFavorites.splice(favoriteIndex, 1);
      action = 'removed';
      console.log('Global favorite removed for photo:', photoIndex);
    }
    
    // Save the updated gallery
    await gallery.save();
    
    console.log('Updated global favorites:', gallery.globalFavorites);
    
    return NextResponse.json({ 
      message: `Favorite ${action}`, 
      action,
      favorites: gallery.globalFavorites
    });
    
  } catch (error) {
    console.error('Error toggling global favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
