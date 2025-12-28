import { NextRequest, NextResponse } from 'next/server';
import { FaceCollectionService } from '@/lib/face-collection';
import CustomerGallery from '@/models/CustomerGallery';
import dbConnect from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { albumCode } = await request.json();
    
    await dbConnect();
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: 'published' 
    });

    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    // Update indexing status to in_progress
    await CustomerGallery.updateOne(
      { albumCode: albumCode.toLowerCase() },
      {
        'faceIndexing.status': 'in_progress',
        'faceIndexing.totalPhotos': gallery.photos.length,
        'faceIndexing.indexedPhotos': 0,
        'faceIndexing.lastUpdated': new Date()
      }
    );

    // Start background indexing (don't wait for completion)
    const collectionId = `gallery-${albumCode}`;
    
    // Create collection if needed
    try {
      await FaceCollectionService.createCollection(collectionId);
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        // Update status to failed
        await CustomerGallery.updateOne(
          { albumCode: albumCode.toLowerCase() },
          { 'faceIndexing.status': 'failed', 'faceIndexing.lastUpdated': new Date() }
        );
        throw error;
      }
    }

    // Start indexing in background
    indexPhotosInBackground(collectionId, gallery.photos, albumCode);

    return NextResponse.json({ 
      message: 'Background indexing started',
      totalPhotos: gallery.photos.length 
    });

  } catch (error) {
    console.error('Background job error:', error);
    return NextResponse.json({ error: 'Failed to start indexing' }, { status: 500 });
  }
}

async function indexPhotosInBackground(collectionId: string, photos: any[], albumCode: string) {
  console.log(`Starting background indexing for ${photos.length} photos`);
  
  const batchSize = 5;
  let indexedCount = 0;
  
  for (let i = 0; i < photos.length; i += batchSize) {
    const batch = photos.slice(i, i + batchSize);
    
    try {
      const promises = batch.map(async (photo, batchIndex) => {
        const response = await fetch(photo.url);
        const imageBytes = Buffer.from(await response.arrayBuffer());
        await FaceCollectionService.indexFaces(collectionId, imageBytes, `photo-${i + batchIndex}`);
        console.log(`Indexed photo ${i + batchIndex + 1}/${photos.length}`);
        indexedCount++;
      });
      
      await Promise.all(promises);
      
      // Update progress
      await CustomerGallery.updateOne(
        { albumCode: albumCode.toLowerCase() },
        {
          'faceIndexing.indexedPhotos': indexedCount,
          'faceIndexing.lastUpdated': new Date()
        }
      );
      
      console.log(`Completed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(photos.length/batchSize)}`);
    } catch (error) {
      console.error(`Error in batch ${Math.floor(i/batchSize) + 1}:`, error);
    }
  }
  
  // Mark as completed
  await CustomerGallery.updateOne(
    { albumCode: albumCode.toLowerCase() },
    {
      'faceIndexing.status': 'completed',
      'faceIndexing.indexedPhotos': indexedCount,
      'faceIndexing.lastUpdated': new Date()
    }
  );
  
  console.log('Background indexing completed!');
}
