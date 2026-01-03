import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BusinessGallery from '@/models/BusinessGallery';

export async function GET(request: NextRequest, { params }: { params: { albumCode: string } }) {
  try {
    await connectDB();
    
    const albumCode = params.albumCode;
    
    // Get current status from database
    const gallery = await BusinessGallery.findOne({ albumCode });
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    const faceIndexing = gallery.faceIndexing || {};
    
    // Return stored status
    return NextResponse.json({
      status: faceIndexing.status || 'not_started',
      progress: faceIndexing.indexedPhotos && gallery.photos ? 
        (faceIndexing.indexedPhotos / gallery.photos.length) * 100 : 0,
      indexedPhotos: faceIndexing.indexedPhotos || 0,
      totalPhotos: gallery.photos?.length || 0,
      lastIndexedAt: faceIndexing.lastIndexedAt,
      errorMessage: faceIndexing.errorMessage
    });

  } catch (error) {
    console.error('Error getting indexing status:', error);
    return NextResponse.json(
      { error: 'Failed to get indexing status' },
      { status: 500 }
    );
  }
}
