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
      
      // Force create collection - this will create it if it doesn't exist
      const { FaceCollectionService } = require('@/lib/face-collection');
      await FaceCollectionService.createCollection(collectionId);
      console.log('Face collection ready:', collectionId);
      
      // Verify collection exists before proceeding
      const { ListCollectionsCommand } = require('@aws-sdk/client-rekognition');
      const listCommand = new ListCollectionsCommand({});
      const listResult = await rekognitionClient.send(listCommand);
      
      if (!listResult.CollectionIds?.includes(collectionId)) {
        throw new Error(`Collection ${collectionId} was not created successfully`);
      }
      
      console.log('Collection verified to exist:', collectionId);
      
    } catch (error: any) {
      console.error('Collection creation error:', error);
      if (error.name === 'ResourceAlreadyExistsException') {
        console.log('Collection already exists:', collectionId);
      } else {
        // Update status to failed
        await CustomerGallery.updateOne(
          { albumCode: albumCode.toLowerCase() },
          { 'faceIndexing.status': 'failed', 'faceIndexing.lastUpdated': new Date() }
        );
        return NextResponse.json({ error: `Failed to create collection: ${error.message}` }, { status: 500 });
      }
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
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;
  
  try {
    // RELIABLE BATCH SIZE for accuracy (like original script)
    const batchSize = 10; // Reduced from 50 to 10 for reliability
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
          
          // Fetch image with headers and timeout
          const fetchStart = Date.now();
          const fetchPromise = fetch(photo.url, { 
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; FaceIndexer/1.0)'
            }
          });
          
          // Add timeout to prevent hanging (increased from 30s to 60s)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fetch timeout')), 60000)
          );
          
          const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
          const fetchTime = Date.now() - fetchStart;
          
          if (!response.ok) {
            throw new Error(`Failed to fetch photo ${photoIndex}: ${response.status}`);
          }
          
          const imageBuffer = Buffer.from(await response.arrayBuffer());
          console.log(`Photo ${photoIndex}: Fetched ${imageBuffer.length} bytes in ${fetchTime}ms`);
          
          // Index faces directly without pre-check for maximum speed
          const rekognitionClient = require('@/lib/aws-config').getRekognitionClient();
          if (!rekognitionClient) {
            throw new Error('AWS Rekognition not configured');
          }
          
          // Index faces directly (will skip if no faces found automatically)
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
          
          // Reset error counter on success
          consecutiveErrors = 0;
          
          // Calculate time remaining (more accurate after 10+ photos)
          const elapsedMs = Date.now() - startTime;
          const avgTimePerPhoto = elapsedMs / indexedCount;
          const remainingPhotos = photos.length - indexedCount;
          const remainingMs = remainingPhotos * avgTimePerPhoto;
          const remainingMinutes = Math.ceil(remainingMs / 60000);
          const realisticMinutes = indexedCount < 15 
            ? Math.ceil((photos.length - indexedCount) * 1) // 60 seconds per photo with AWS delays
            : Math.ceil(remainingMs / 60000);
          
          await CustomerGallery.updateOne(
            { albumCode: albumCode.toLowerCase() },
            {
              'faceIndexing.indexedPhotos': indexedCount,
              'faceIndexing.lastUpdated': new Date(),
              'faceIndexing.estimatedTimeRemaining': realisticMinutes
            }
          );
          
          // AWS-safe delay between photos (stay well under 20 TPS limit)
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second = 1 TPS (safe)
          
        } catch (photoError) {
          consecutiveErrors++;
          console.error(`Error processing photo ${photoIndex} (${consecutiveErrors}/${maxConsecutiveErrors}):`, photoError);
          
          // If collection doesn't exist, stop indexing immediately
          if ((photoError as any).name === 'ResourceNotFoundException' && (photoError as any).message?.includes('does not exist')) {
            console.error(`Collection ${collectionId} does not exist. Stopping indexing.`);
            throw new Error(`Collection ${collectionId} not found - indexing stopped`);
          }
          
          // If too many consecutive errors, stop indexing
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error(`Too many consecutive errors (${maxConsecutiveErrors}). Stopping indexing.`);
            throw new Error(`Indexing stopped after ${maxConsecutiveErrors} consecutive errors`);
          }
          
          // Continue with next photo instead of failing entire batch
          continue;
        }
      }
      
      // AWS-safe delay between batches (extra buffer for rate limits)
      console.log(`Batch ${batchIndex + 1} completed. Indexed ${indexedCount}/${photos.length} photos so far.`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay between batches
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
