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
    
    // Better IP detection for production
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
    const customerIP = cfConnectingIP || (forwarded ? forwarded.split(',')[0] : realIP) || 'unknown';
    
    console.log('Loading favorites for IP:', customerIP, 'albumCode:', albumCode);
    
    // Find the gallery - allow both published and draft for now
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
    
    // Get all favorites for this gallery and IP
    const favorites = await CustomerFavorite.find({
      galleryId: gallery._id,
      customerIP
    });
    
    // Extract just the photo indices
    const favoriteIndices = favorites.map(fav => fav.photoIndex);
    
    console.log('Found favorites:', favoriteIndices);
    
    return NextResponse.json({ favorites: favoriteIndices });
  } catch (error) {
    console.error('Error loading favorites:', error);
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
    
    // Better IP detection for production
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
    const customerIP = cfConnectingIP || (forwarded ? forwarded.split(',')[0] : realIP) || 'unknown';
    
    console.log('Toggle favorite for IP:', customerIP, 'albumCode:', albumCode, 'photoIndex:', photoIndex);
    
    // Find the gallery - allow both published and draft for now
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
      console.log('Favorite added');
      return NextResponse.json({ message: 'Favorite added', action: 'added' });
    } else {
      // Remove existing favorite
      await CustomerFavorite.deleteOne({
        galleryId: gallery._id,
        photoIndex,
        customerIP
      });
      console.log('Favorite removed');
      return NextResponse.json({ message: 'Favorite removed', action: 'removed' });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
