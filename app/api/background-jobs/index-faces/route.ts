import { NextRequest, NextResponse } from 'next/server';
import { FaceCollectionService } from '@/lib/face-collection';
import CustomerGallery from '@/models/CustomerGallery';
import dbConnect from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('=== BACKGROUND INDEXING JOB STARTED ===');
    const { albumCode } = await request.json();
    console.log('Received indexing request for albumCode:', albumCode);
    
    await dbConnect();
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase()
    });

    if (!gallery) {
      console.log('Gallery not found for albumCode:', albumCode);
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    console.log('Found gallery with', gallery.photos.length, 'photos');
    console.log('Gallery photos sample:', gallery.photos.slice(0, 2).map((p: any) => p.alt));

    // Update indexing status to in_progress
    await CustomerGallery.updateOne(
      { albumCode: albumCode.toLowerCase() },
      {
        'faceIndexing.status': 'in_progress',
        'faceIndexing.totalPhotos': gallery.photos.length,
        'faceIndexing.indexedPhotos': 0,
        'faceIndexing.lastUpdated': new Date(),
        'faceIndexing.estimatedTimeRemaining': 0
      }
    );

    console.log('Updated indexing status to in_progress');

    // Start background indexing (don't wait for completion)
    const collectionId = `gallery-${albumCode}`;
    
    // Create collection if needed
    try {
      console.log('Checking AWS credentials...');
      const rekognitionClient = require('@/lib/aws-config').getRekognitionClient();
      if (!rekognitionClient) {
        console.error('AWS Rekognition not configured - missing credentials');
        await CustomerGallery.updateOne(
          { albumCode: albumCode.toLowerCase() },
          { 'faceIndexing.status': 'failed', 'faceIndexing.lastUpdated': new Date() }
        );
        return NextResponse.json({ error: 'AWS Rekognition not configured' }, { status: 500 });
      }
      console.log('AWS credentials OK, creating collection...');
      await FaceCollectionService.createCollection(collectionId);
      console.log('Face collection ready:', collectionId);
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        // Update status to failed
        await CustomerGallery.updateOne(
          { albumCode: albumCode.toLowerCase() },
          { 'faceIndexing.status': 'failed', 'faceIndexing.lastUpdated': new Date() }
        );
        throw error;
      }
      console.log('Face collection already exists:', collectionId);
    }

    // Start indexing in background
    console.log('Starting background indexing process...');
    
    // Fire and forget - don't wait for completion
    console.log('=== CALLING INDEXING FUNCTION ASYNC ===');
    indexPhotosInBackground(collectionId, gallery.photos, albumCode);
    console.log('=== INDEXING FUNCTION STARTED (ASYNC) ===');

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
  console.log(`=== OPTIMIZED INDEXING STARTED ===`);
  console.log(`Starting OPTIMIZED background indexing for ${photos.length} photos`);
  
  const startTime = Date.now();
  
  try {
    // OPTIMIZED BATCH SIZE for maximum speed
    const batchSize = 20; // Increased from 15 to 20 for faster processing
    let indexedCount = 0;
    const totalBatches = Math.ceil(photos.length / batchSize);
    
    console.log(`Processing ${totalBatches} batches of ${batchSize} photos each`);
    
    // Process batches sequentially for reliability
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, photos.length);
      const batch = photos.slice(startIndex, endIndex);
      
      console.log(`\n=== BATCH ${batchIndex + 1}/${totalBatches} ===`);
      console.log(`Processing photos ${startIndex + 1}-${endIndex} of ${photos.length}`);
      
      // Process each photo individually for maximum reliability
      for (let i = 0; i < batch.length; i++) {
        const photo = batch[i];
        const photoIndex = startIndex + i + 1;
        
        try {
          console.log(`Fetching photo ${photoIndex}/${photos.length}: ${photo.alt}`);
          
          // Fetch image with headers
          const fetchStart = Date.now();
          const response = await fetch(photo.url, { 
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; FaceIndexer/1.0)'
            }
          });
          const fetchTime = Date.now() - fetchStart;
          
          if (!response.ok) {
            console.error(`Failed to fetch photo ${photoIndex}: ${response.status}`);
            continue;
          }
          
          const imageBuffer = Buffer.from(await response.arrayBuffer());
          console.log(`Photo ${photoIndex}: Fetched ${imageBuffer.length} bytes in ${fetchTime}ms`);
          
          // Index face with AWS Rekognition
          const rekognitionClient = require('@/lib/aws-config').getRekognitionClient();
          if (!rekognitionClient) {
            throw new Error('AWS Rekognition not configured');
          }
          
          const { IndexFacesCommand } = require('@aws-sdk/client-rekognition');
          const command = new IndexFacesCommand({
            CollectionId: collectionId,
            Image: { Bytes: imageBuffer },
            ExternalImageId: `${albumCode}-${photoIndex}`,
            MaxFaces: 10,
            QualityFilter: 'AUTO'
          });
          
          const awsStart = Date.now();
          const result = await rekognitionClient.send(command);
          const awsTime = Date.now() - awsStart;
          indexedCount++;
          
          console.log(`Photo ${photoIndex}: Indexed ${result.FaceRecords?.length || 0} faces in ${awsTime}ms`);
          
          // Calculate time remaining (more accurate after 10+ photos)
          const elapsedMs = Date.now() - startTime;
          const avgTimePerPhoto = elapsedMs / indexedCount;
          const remainingPhotos = photos.length - indexedCount;
          const remainingMs = remainingPhotos * avgTimePerPhoto;
          const remainingMinutes = Math.ceil(remainingMs / 60000);
          
          // Use realistic minimum after first few photos
          const realisticMinutes = indexedCount < 10 
            ? Math.ceil((photos.length - indexedCount) * 0.5) // 30 seconds per photo estimate
            : remainingMinutes;
          
          console.log(`Time calculation: elapsed=${elapsedMs}ms, avgPerPhoto=${avgTimePerPhoto}ms, remaining=${remainingPhotos} photos, ETA=${realisticMinutes}min`);
          console.log(`Progress: ${indexedCount}/${photos.length} (${Math.round((indexedCount/photos.length)*100)}%) - ETA: ${realisticMinutes} min`);
          
          // Update progress after each photo for smooth progress bar
          await CustomerGallery.updateOne(
            { albumCode: albumCode.toLowerCase() },
            {
              'faceIndexing.indexedPhotos': indexedCount,
              'faceIndexing.lastUpdated': new Date(),
              'faceIndexing.estimatedTimeRemaining': realisticMinutes
            }
          );
          
          // Add rate limiting delay to avoid AWS throttling
          await new Promise(resolve => setTimeout(resolve, 200)); // Increased from 50ms to 200ms
          
        } catch (photoError) {
          console.error(`Error processing photo ${photoIndex}:`, photoError);
          // Continue with next photo instead of failing entire batch
        }
      }
      
      // Minimal delay between batches for maximum speed
      console.log(`Batch ${batchIndex + 1} completed. Indexed ${indexedCount}/${photos.length} photos so far.`);
      await new Promise(resolve => setTimeout(resolve, 200)); // Reduced from 500ms to 200ms
    }
    
    // Final status update
    await CustomerGallery.updateOne(
      { albumCode: albumCode.toLowerCase() },
      {
        'faceIndexing.status': 'completed',
        'faceIndexing.indexedPhotos': indexedCount,
        'faceIndexing.isReadyToSend': indexedCount > 0,
        'faceIndexing.lastUpdated': new Date(),
        'faceIndexing.estimatedTimeRemaining': 0
      }
    );
    
    console.log(`=== INDEXING COMPLETED ===`);
    console.log(`Successfully indexed ${indexedCount} out of ${photos.length} photos`);
    
  } catch (error) {
    console.error('Indexing failed:', error);
    await CustomerGallery.updateOne(
      { albumCode: albumCode.toLowerCase() },
      {
        'faceIndexing.status': 'failed',
        'faceIndexing.lastUpdated': new Date()
      }
    );
  }
}
