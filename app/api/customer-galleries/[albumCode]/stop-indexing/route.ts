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
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    // Update status to show server indexing is stopped
    await CustomerGallery.updateOne(
      { albumCode: albumCode.toLowerCase() },
      { 
        $set: {
          'faceIndexing.status': 'stopped_by_electron',
          'faceIndexing.lastIndexedAt': new Date(),
          'faceIndexing.serverStopped': true
        }
      }
    );

    console.log(`🛑 Server indexing stopped for album: ${albumCode} (Electron app taking over)`);

    return NextResponse.json({
      success: true,
      message: 'Server indexing stopped, Electron app can now take over',
      albumCode,
      status: 'stopped_by_electron'
    });

  } catch (error) {
    console.error('Error stopping server indexing:', error);
    return NextResponse.json(
      { error: 'Failed to stop server indexing' },
      { status: 500 }
    );
  }
}
