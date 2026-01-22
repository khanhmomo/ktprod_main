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
    console.log('Looking for gallery with albumCode:', albumCode.toLowerCase());
    
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: { $in: ['published', 'draft'] }, // Allow both published and draft for now
      isActive: true 
    }).select('-customerFavorites');
    
    console.log('Found gallery:', gallery);
    
    if (!gallery) {
      // Try to find the gallery regardless of status for debugging
      const anyGallery = await CustomerGallery.findOne({ 
        albumCode: albumCode.toLowerCase(),
        isActive: true 
      }).select('-customerFavorites');
      
      console.log('Any gallery found:', anyGallery);
      
      return NextResponse.json(
        { error: 'Gallery not found or not accessible' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(gallery);
  } catch (error) {
    console.error('Error fetching public gallery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}
