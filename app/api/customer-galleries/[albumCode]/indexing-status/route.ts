import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CustomerGallery from '@/models/CustomerGallery';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumCode: string }> }
) {
  try {
    const { albumCode } = await params;
    
    await dbConnect();
    
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase() 
    }).select('faceIndexing photos albumCode');
    
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    const progress = gallery.faceIndexing.totalPhotos > 0 
      ? Math.round((gallery.faceIndexing.indexedPhotos / gallery.faceIndexing.totalPhotos) * 100)
      : 0;

    return NextResponse.json({
      status: gallery.faceIndexing.status,
      totalPhotos: gallery.faceIndexing.totalPhotos,
      indexedPhotos: gallery.faceIndexing.indexedPhotos,
      progress,
      lastUpdated: gallery.faceIndexing.lastUpdated,
      isReadyToSend: gallery.faceIndexing.status === 'completed',
      estimatedTimeRemaining: gallery.faceIndexing.estimatedTimeRemaining || 0
    });

  } catch (error) {
    console.error('Error fetching indexing status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
