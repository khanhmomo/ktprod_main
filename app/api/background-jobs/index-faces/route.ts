import { NextRequest, NextResponse } from 'next/server';
import { FaceCollectionService } from '@/lib/face-collection';
import CustomerGallery from '@/models/CustomerGallery';
import dbConnect from '@/lib/db';
import sharp from 'sharp';

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

    // Check if face recognition is enabled for this gallery
    if (!gallery.faceRecognitionEnabled) {
      console.log('Face recognition is disabled for gallery:', albumCode);
      return NextResponse.json({ 
        error: 'Face recognition is not enabled for this gallery',
        message: 'This gallery does not have face recognition enabled'
      }, { status: 400 });
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
    
    // Update progress immediately to show indexing has started
    await CustomerGallery.updateOne(
      { albumCode: albumCode.toLowerCase() },
      {
        'faceIndexing.indexedPhotos': 0, // Start from 0, will update to 1 when first photo processes
        'faceIndexing.lastUpdated': new Date(),
        'faceIndexing.estimatedTimeRemaining': Math.ceil(gallery.photos.length * 0.3) // Estimate 18 seconds per photo
      }
    );
    
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
    // SERVERLESS-OPTIMIZED BATCH SIZE
    const batchSize = 3; // Very small for serverless reliability
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
          
          // Fetch image with headers, timeout, and retry logic
          const fetchStart = Date.now();
          let response: Response | null = null;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              const fetchPromise = fetch(photo.url, { 
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; FaceIndexer/1.0)'
                }
              });
              
              // Add timeout to prevent hanging (increased from 30s to 60s)
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Fetch timeout')), 60000)
              );
              
              response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
              break; // Success, exit retry loop
              
            } catch (fetchError) {
              retryCount++;
              console.log(`Photo ${photoIndex}: Fetch attempt ${retryCount}/${maxRetries} failed:`, fetchError);
              
              if (retryCount >= maxRetries) {
                throw fetchError; // Re-throw after max retries
              }
              
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            }
          }
          
          if (!response) {
            throw new Error(`Failed to fetch photo ${photoIndex} after ${maxRetries} retries`);
          }
          
          const fetchTime = Date.now() - fetchStart;
          
          if (!response.ok) {
            throw new Error(`Failed to fetch photo ${photoIndex}: ${response.status}`);
          }
          
          const imageBuffer = Buffer.from(await response.arrayBuffer());
          console.log(`Photo ${photoIndex}: Fetched ${imageBuffer.length} bytes in ${fetchTime}ms`);
          
          // Resize image with Sharp (aggressive for large images)
          let resizedImage;
          try {
            console.log(`Photo ${photoIndex}: Starting Sharp resize...`);
            
            // Calculate target quality based on original size
            let quality = 85;
            let targetSize = 800;
            
            // More aggressive resize for large images
            if (imageBuffer.length > 10 * 1024 * 1024) { // >10MB
              quality = 60;
              targetSize = 600;
            } else if (imageBuffer.length > 5 * 1024 * 1024) { // >5MB
              quality = 70;
              targetSize = 700;
            }
            
            // Multi-stage resize for very large images
            let sharpPipeline = sharp(imageBuffer);
            
            // For very large images, do progressive resize
            if (imageBuffer.length > 10 * 1024 * 1024) {
              sharpPipeline = sharpPipeline
                .resize(1200, 1200, { fit: 'inside' }) // First stage
                .resize(targetSize, targetSize, { fit: 'inside' }); // Second stage
            } else {
              sharpPipeline = sharpPipeline
                .resize(targetSize, targetSize, { fit: 'inside' });
            }
            
            resizedImage = await sharpPipeline
              .jpeg({ 
                quality: quality,
                progressive: true,
                mozjpeg: true // Better compression
              })
              .toBuffer();
            
            console.log(`Photo ${photoIndex}: Resized from ${imageBuffer.length} to ${resizedImage.length} bytes (quality: ${quality}%)`);
            
            // If still too large, try even more aggressive compression
            if (resizedImage.length > 5 * 1024 * 1024) {
              console.log(`Photo ${photoIndex}: Still too large, applying extreme compression...`);
              resizedImage = await sharp(resizedImage)
                .resize(400, 400, { fit: 'inside' })
                .jpeg({ quality: 40 })
                .toBuffer();
              
              console.log(`Photo ${photoIndex}: Extreme compression: ${resizedImage.length} bytes`);
            }
            
            // Final check - if still too large, skip
            if (resizedImage.length > 5 * 1024 * 1024) {
              console.log(`Photo ${photoIndex}: Still too large after compression (${resizedImage.length} bytes), skipping`);
              indexedCount++; // Count as processed for progress
              continue;
            }
            
          } catch (sharpError) {
            console.error(`Photo ${photoIndex}: Sharp resize failed:`, sharpError);
            // Fallback to original image if Sharp fails
            resizedImage = imageBuffer;
            console.log(`Photo ${photoIndex}: Using original image (${resizedImage.length} bytes)`);
          }
          
          // Pre-check if photo contains faces before attempting to index
          const rekognitionClient = require('@/lib/aws-config').getRekognitionClient();
          if (!rekognitionClient) {
            throw new Error('AWS Rekognition not configured');
          }
          
          // First detect faces to avoid indexing photos with no people
          const { DetectFacesCommand } = require('@aws-sdk/client-rekognition');
          const detectCommand = new DetectFacesCommand({
            Image: { Bytes: resizedImage },
            Attributes: ['ALL']
          });
          
          const detectResult = await rekognitionClient.send(detectCommand);
          const facesDetected = detectResult.FaceDetails?.length || 0;
          
          if (facesDetected === 0) {
            console.log(`Photo ${photoIndex}: No faces detected - skipping gracefully`);
            indexedCount++; // Still count as processed for progress
            
            // Update progress for skipped photo
            const elapsedMs = Date.now() - startTime;
            const avgTimePerPhoto = elapsedMs / indexedCount;
            const remainingPhotos = photos.length - indexedCount;
            const remainingMs = remainingPhotos * avgTimePerPhoto;
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            
            const realisticMinutes = indexedCount < 15 
              ? Math.ceil((photos.length - indexedCount) * 0.3)
              : Math.ceil(remainingMs / 60000);
            
            await CustomerGallery.updateOne(
              { albumCode: albumCode.toLowerCase() },
              {
                'faceIndexing.indexedPhotos': indexedCount,
                'faceIndexing.lastUpdated': new Date(),
                'faceIndexing.estimatedTimeRemaining': realisticMinutes
              }
            );
            
            // Reduced delay for skipped photos
            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms for skipped photos
            continue; // Skip to next photo
          }
          
          // Index faces (only if faces were detected)
          const { IndexFacesCommand } = require('@aws-sdk/client-rekognition');
          const command = new IndexFacesCommand({
            CollectionId: collectionId,
            Image: { Bytes: resizedImage }, // Use resized image
            ExternalImageId: `photo-${photoIndex - 1}`, // Use 0-based index to match face search
            MaxFaces: 10,
            QualityFilter: 'AUTO'
          });
          
          const awsStart = Date.now();
          const result = await rekognitionClient.send(command);
          const awsTime = Date.now() - awsStart;
          indexedCount++;
          
          const facesFound = result.FaceRecords?.length || 0;
          if (facesFound === 0) {
            console.log(`Photo ${photoIndex}: No faces detected - skipping (${awsTime}ms)`);
          } else {
            console.log(`Photo ${photoIndex}: Successfully indexed ${facesFound} faces in ${awsTime}ms`);
          }
          
          // Reset error counter on success
          consecutiveErrors = 0;
          
          // Calculate time remaining (more accurate after 10+ photos)
          const elapsedMs = Date.now() - startTime;
          const avgTimePerPhoto = elapsedMs / indexedCount;
          const remainingPhotos = photos.length - indexedCount;
          const remainingMs = remainingPhotos * avgTimePerPhoto;
          const remainingMinutes = Math.ceil(remainingMs / 60000);
          const realisticMinutes = indexedCount < 15 
            ? Math.ceil((photos.length - indexedCount) * 0.3) // 18 seconds per photo with Sharp resizing
            : Math.ceil(remainingMs / 60000);
          
          await CustomerGallery.updateOne(
            { albumCode: albumCode.toLowerCase() },
            {
              'faceIndexing.indexedPhotos': indexedCount,
              'faceIndexing.lastUpdated': new Date(),
              'faceIndexing.estimatedTimeRemaining': realisticMinutes
            }
          );
          
          // Reduced delay since images are now much smaller (80KB vs 2-5MB)
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms = 2 TPS (still safe)
          
        } catch (photoError) {
          consecutiveErrors++;
          console.error(`Error processing photo ${photoIndex} (${consecutiveErrors}/${maxConsecutiveErrors}):`, photoError);
          
          // If collection doesn't exist, stop indexing immediately
          if ((photoError as any).name === 'ResourceNotFoundException' && (photoError as any).message?.includes('does not exist')) {
            console.error(`Collection ${collectionId} does not exist. Stopping indexing.`);
            throw new Error(`Collection ${collectionId} not found - indexing stopped`);
          }
          
          // Handle AWS Rekognition errors for photos with no faces
          if ((photoError as any).name === 'InvalidParameterException' && 
              ((photoError as any).message?.includes('no faces detected') ||
               (photoError as any).message?.includes('Unable to detect') ||
               (photoError as any).message?.includes('face'))) {
            console.log(`Photo ${photoIndex}: No faces detected - skipping gracefully`);
            indexedCount++; // Still count as processed for progress
            
            // Update progress for skipped photo
            const elapsedMs = Date.now() - startTime;
            const avgTimePerPhoto = elapsedMs / indexedCount;
            const remainingPhotos = photos.length - indexedCount;
            const remainingMs = remainingPhotos * avgTimePerPhoto;
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            
            const realisticMinutes = indexedCount < 15 
              ? Math.ceil((photos.length - indexedCount) * 0.3)
              : Math.ceil(remainingMs / 60000);
            
            await CustomerGallery.updateOne(
              { albumCode: albumCode.toLowerCase() },
              {
                'faceIndexing.indexedPhotos': indexedCount,
                'faceIndexing.lastUpdated': new Date(),
                'faceIndexing.estimatedTimeRemaining': realisticMinutes
              }
            );
            
            consecutiveErrors = 0; // Reset error counter for skipped photos
            continue; // Skip to next photo
          }
          
          // If too many consecutive errors, stop indexing
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error(`Too many consecutive errors (${maxConsecutiveErrors}). Stopping indexing.`);
            throw new Error(`Indexing stopped after ${maxConsecutiveErrors} consecutive errors`);
          }
          
          // For fetch failures, skip the photo but continue indexing
          if ((photoError as any).message?.includes('fetch failed') || 
              (photoError as any).message?.includes('Fetch timeout') ||
              (photoError as any).message?.includes('Failed to fetch')) {
            console.log(`Photo ${photoIndex}: Skipping due to fetch error, continuing with next photo`);
            indexedCount++; // Still count as processed for progress
            
            // Update progress for skipped photo
            const elapsedMs = Date.now() - startTime;
            const avgTimePerPhoto = elapsedMs / indexedCount;
            const remainingPhotos = photos.length - indexedCount;
            const remainingMs = remainingPhotos * avgTimePerPhoto;
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            
            const realisticMinutes = indexedCount < 15 
              ? Math.ceil((photos.length - indexedCount) * 0.3) // 18 seconds per photo with Sharp resizing
              : Math.ceil(remainingMs / 60000);
            
            await CustomerGallery.updateOne(
              { albumCode: albumCode.toLowerCase() },
              {
                'faceIndexing.indexedPhotos': indexedCount,
                'faceIndexing.lastUpdated': new Date(),
                'faceIndexing.estimatedTimeRemaining': realisticMinutes
              }
            );
            
            consecutiveErrors = 0; // Reset error counter for skipped photos
            continue; // Skip to next photo
          }
          
          // Continue with next photo instead of failing entire batch
          continue;
        }
      }
      
      // Reduced batch delay since images are smaller
      console.log(`Batch ${batchIndex + 1} completed. Indexed ${indexedCount}/${photos.length} photos so far.`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between batches
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
