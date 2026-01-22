import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerGallery from '@/models/CustomerGallery';
import { CustomerFavorite } from '@/models/CustomerGallery';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { albumCode, photoIndex } = await request.json();
    const customerIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
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
    
    // Check if favorite already exists
    const existingFavorite = await CustomerFavorite.findOne({
      galleryId: gallery._id,
      photoIndex,
      customerIP
    });
    
    if (!existingFavorite) {
      // Create new favorite
      const favorite = new CustomerFavorite({
        galleryId: gallery._id,
        photoIndex,
        customerIP
      });
      await favorite.save();
    }
    
    return NextResponse.json({ message: 'Favorite added' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { albumCode, photoIndex } = await request.json();
    const customerIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
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
    
    // Remove favorite
    await CustomerFavorite.deleteOne({
      galleryId: gallery._id,
      photoIndex,
      customerIP
    });
    
    return NextResponse.json({ message: 'Favorite removed' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
