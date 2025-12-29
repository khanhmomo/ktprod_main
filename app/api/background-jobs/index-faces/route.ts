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
    
    // For debugging, run synchronously first
    console.log('=== CALLING INDEXING FUNCTION DIRECTLY ===');
    await indexPhotosInBackground(collectionId, gallery.photos, albumCode);
    console.log('=== INDEXING FUNCTION COMPLETED ===');

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
  console.log(`=== INDEXING FUNCTION CALLED ===`);
  console.log(`Starting FAST background indexing for ${photos.length} photos`);
  
  try {
    // INCREASED BATCH SIZE for much faster processing
    const batchSize = 20; // Increased from 5 to 20
    let indexedCount = 0;
    const totalBatches = Math.ceil(photos.length / batchSize);
    
    // Pre-fetch all images in parallel for maximum speed
    console.log('Pre-fetching all images in parallel...');
    const imageBuffers: Buffer[] = [];
    
    // Fetch all images concurrently (this is the bottleneck)
    const fetchPromises = photos.map(async (photo, index) => {
      try {
        console.log(`Fetching photo ${index + 1}/${photos.length}: ${photo.url}`);
        const response = await fetch(photo.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const imageBytes = Buffer.from(await response.arrayBuffer());
        console.log(`Successfully fetched photo ${index + 1}, size: ${imageBytes.length} bytes`);
        return { index, imageBytes };
      } catch (error) {
        console.error(`Failed to fetch photo ${index}:`, error);
        return { index, imageBytes: null, error };
      }
    });
    
    const fetchedImages = await Promise.all(fetchPromises);
    
    // Sort by index and extract buffers
    fetchedImages.sort((a, b) => a.index - b.index);
    const validBuffers = fetchedImages
      .map(item => item.imageBytes)
      .filter(buffer => buffer !== null);
    
    const failedFetches = fetchedImages.filter(item => item.imageBytes === null);
    if (failedFetches.length > 0) {
      console.error(`Failed to fetch ${failedFetches.length} photos:`, failedFetches.map(f => f.error));
    }
    
    console.log(`Fetched ${validBuffers.length}/${photos.length} images successfully`);
    
    if (validBuffers.length === 0) {
      throw new Error('No images could be fetched successfully');
    }
    
    // Process in larger batches with parallel AWS calls
    for (let i = 0; i < validBuffers.length; i += batchSize) {
      const batch = validBuffers.slice(i, i + batchSize);
      
      try {
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${totalBatches} with ${batch.length} photos`);
        
        // Process all photos in batch concurrently
        const promises = batch.map(async (imageBuffer, batchIndex) => {
          try {
            await FaceCollectionService.indexFaces(collectionId, imageBuffer, `photo-${i + batchIndex}`);
            return true;
          } catch (error) {
            console.error(`Failed to index photo ${i + batchIndex}:`, error);
            return false;
          }
        });
        
        const results = await Promise.all(promises);
        indexedCount += results.filter(r => r).length;
        
        // Update progress less frequently to reduce DB writes
        if (i % (batchSize * 2) === 0 || i + batchSize >= validBuffers.length) {
          await CustomerGallery.updateOne(
            { albumCode: albumCode.toLowerCase() },
            {
              'faceIndexing.indexedPhotos': indexedCount,
              'faceIndexing.lastUpdated': new Date()
            }
          );
          
          const progress = Math.round((indexedCount / photos.length) * 100);
          console.log(`Progress: ${indexedCount}/${photos.length} (${progress}%) - Batch ${Math.floor(i/batchSize) + 1}/${totalBatches}`);
        }
        
        // Small delay to prevent AWS rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
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
    
    console.log(`FAST indexing completed! Indexed ${indexedCount}/${photos.length} photos`);
    
  } catch (error) {
    console.error('Critical error in indexing:', error);
    
    // Mark as failed
    await CustomerGallery.updateOne(
      { albumCode: albumCode.toLowerCase() },
      {
        'faceIndexing.status': 'failed',
        'faceIndexing.lastUpdated': new Date()
      }
    );
  }
}
