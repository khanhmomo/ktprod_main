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

    return NextResponse.json({
      status: gallery.faceIndexing?.status || 'not_started',
      totalPhotos: gallery.faceIndexing?.totalPhotos || 0,
      indexedPhotos: gallery.faceIndexing?.indexedPhotos || 0,
      progress: gallery.faceIndexing?.totalPhotos > 0 
        ? Math.round((gallery.faceIndexing?.indexedPhotos || 0) / gallery.faceIndexing.totalPhotos * 100)
        : 0,
      lastUpdated: gallery.faceIndexing?.lastUpdated || gallery.updatedAt,
      isReadyToSend: gallery.faceIndexing?.status === 'completed',
      estimatedTimeRemaining: gallery.faceIndexing?.estimatedTimeRemaining || 0,
      electronApp: gallery.faceIndexing?.electronApp || false,
      serverStopped: gallery.faceIndexing?.serverStopped || false
    });

  } catch (error) {
    console.error('Error fetching indexing status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
