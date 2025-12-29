import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CustomerGallery from '@/models/CustomerGallery';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumCode: string }> }
) {
  try {
    const { albumCode } = await params;
    
    await dbConnect();
    
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase()
    });

    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    if (!gallery.photos || gallery.photos.length === 0) {
      return NextResponse.json({ error: 'Gallery has no photos to index' }, { status: 400 });
    }

    // Trigger background indexing
    console.log('Manual trigger: Starting background face indexing for gallery:', albumCode);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/background-jobs/index-faces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albumCode })
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: 'Failed to start indexing', details: error.error }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Indexing started successfully',
      totalPhotos: gallery.photos.length 
    });

  } catch (error) {
    console.error('Error triggering indexing:', error);
    return NextResponse.json({ error: 'Failed to trigger indexing' }, { status: 500 });
  }
}
