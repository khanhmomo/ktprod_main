#!/usr/bin/env node
// Load environment variables first
require('dotenv').config({ path: '/Users/khanhtran/ktprod_main/.env.local' });
// Debug dotenv loading
console.log('Loaded .env.local from:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);

const https = require('https');
const { RekognitionClient, CreateCollectionCommand, IndexFacesCommand } = require('@aws-sdk/client-rekognition');
const sharp = require('sharp');
const fs = require('fs');

// AWS Configuration
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Debug credentials
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Found' : 'Not found');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Found' : 'Not found');
console.log('AWS_REGION:', process.env.AWS_REGION);

// Add this here
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');
console.log('Looking for .env.local at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

// Get all galleries from server
async function getGalleries() {
  return new Promise((resolve, reject) => {
    https.get('https://thewildstudio.org/api/customer-galleries', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Update gallery status
async function updateGalleryStatus(albumCode, status, indexedPhotos, totalPhotos) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ status, indexedPhotos, totalPhotos });
    const options = {
      hostname: 'thewildstudio.org',
      port: 443,
      path: `/api/customer-galleries/${albumCode}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      console.log(`[${albumCode}] PATCH response status: ${res.statusCode}`);
      res.on('data', (chunk) => {
        console.log(`[${albumCode}] PATCH response:`, chunk.toString());
      });
      res.on('end', () => {
        console.log(`[${albumCode}] PATCH completed`);
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error(`[${albumCode}] PATCH request error:`, error);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Create collection
async function ensureCollection(albumCode) {
  const collectionId = `gallery-${albumCode}`;
  try {
    await rekognitionClient.send(new CreateCollectionCommand({ CollectionId: collectionId }));
    console.log(`Created collection: ${collectionId}`);
  } catch (error) {
    if (error.name !== 'ResourceAlreadyExistsException') {
      throw error;
    }
  }
}

// Download and resize image with redirect handling
async function downloadAndResizeImage(url) {
  return new Promise((resolve, reject) => {
    console.log(`DEBUG: Attempting to download: ${url}`);
    
    const req = https.get(url, (res) => {
      console.log(`DEBUG: Response status: ${res.statusCode}`);
      
      // Handle redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`DEBUG: Redirecting to: ${res.headers.location}`);
        // Follow the redirect
        return downloadAndResizeImage(res.headers.location).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', async () => {
        try {
          const imageBuffer = Buffer.concat(chunks);
          console.log(`DEBUG: Downloaded ${imageBuffer.length} bytes`);
          
          if (imageBuffer.length === 0) {
            reject(new Error('Empty buffer'));
            return;
          }
          
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
          
          const resizedImage = await sharpPipeline
            .jpeg({ 
              quality: quality,
              progressive: true,
              mozjpeg: true // Better compression
            })
            .toBuffer();
          
          console.log(`DEBUG: Resized from ${imageBuffer.length} to ${resizedImage.length} bytes (quality: ${quality}%)`);
          
          // If still too large, try even more aggressive compression
          if (resizedImage.length > 5 * 1024 * 1024) {
            console.log(`DEBUG: Still too large, applying extreme compression...`);
            const extremeResized = await sharp(resizedImage)
              .resize(400, 400, { fit: 'inside' })
              .jpeg({ quality: 40 })
              .toBuffer();
            
            console.log(`DEBUG: Extreme compression: ${extremeResized.length} bytes`);
            resolve(extremeResized);
            return;
          }
          
          // Final check - if still too large, use original but warn
          if (resizedImage.length > 5 * 1024 * 1024) {
            console.log(`DEBUG: Still too large after compression (${resizedImage.length} bytes), using original`);
            resolve(imageBuffer);
            return;
          }
          
          console.log(`DEBUG: Resized to ${resizedImage.length} bytes`);
          resolve(resizedImage);
        } catch (error) {
          console.error(`DEBUG: Sharp error:`, error.message);
          reject(error);
        }
      });
      res.on('error', reject);
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Download timeout'));
    });
  });
}


// Table display functions
function clearScreen() {
  console.clear();
}

function clearFromLine(lineNumber) {
  // Clear from specific line to bottom of terminal
  process.stdout.write(`\x1b[${lineNumber};0H\x1b[J`);
}

function displayHeader() {
  console.log('\n' + '='.repeat(100));
  console.log('🎯 ACCURATE FACE INDEXING - DETAILED PROGRESS');
  console.log('='.repeat(100));
}

function displayGalleryTable(galleries, currentGallery = null, currentIndex = 0, totalIndexed = 0) {
  // Move cursor to top left (1,1) to overwrite previous content
  process.stdout.write('\x1b[H');
  displayHeader();
  
  console.log('Album Code'.padEnd(15) + ' | ' + 'Photos'.padEnd(8) + ' | ' + 'Indexed'.padEnd(8) + ' | ' + 'Status'.padEnd(12) + ' | ' + 'Progress');
  console.log('-'.repeat(100));
  
  galleries.forEach((gallery, index) => {
    const indexing = gallery.faceIndexing || {};
    const status = indexing.status || 'not_started';
    const indexed = indexing.indexedPhotos || 0;
    const total = indexing.totalPhotos || (gallery.photos?.length || 0);
    
    let statusDisplay = status;
    let progressDisplay = '';
    let prefix = '';
    
    if (index === currentIndex && currentGallery) {
      prefix = '👉 ';
      statusDisplay = 'PROCESSING';
      progressDisplay = `${totalIndexed}/${total}`;
    } else if (status === 'completed') {
      statusDisplay = '✅ COMPLETED';
      progressDisplay = `${indexed}/${total}`;
    } else if (status === 'in_progress') {
      statusDisplay = '🔄 PROGRESS';
      progressDisplay = `${indexed}/${total}`;
    } else if (status === 'failed') {
      statusDisplay = '❌ FAILED';
      progressDisplay = `${indexed}/${total}`;
    } else {
      statusDisplay = '⏳ PENDING';
      progressDisplay = `0/${total}`;
    }
    
    console.log(
      prefix + gallery.albumCode.padEnd(15) + ' | ' +
      total.toString().padEnd(8) + ' | ' +
      indexed.toString().padEnd(8) + ' | ' +
      statusDisplay.padEnd(12) + ' | ' +
      progressDisplay
    );
  });
  
  console.log('-'.repeat(100));
  
  if (currentGallery) {
    const percent = Math.round((totalIndexed / currentGallery.photos.length) * 100);
    const progressBar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));
    console.log(`📊 Current: ${currentGallery.albumCode} - ${totalIndexed}/${currentGallery.photos.length} (${percent}%)`);
    console.log(`[${progressBar}]`);
  }
  
  console.log(`📈 Total galleries: ${galleries.length} | Overall progress: ${currentIndex}/${galleries.length}`);
  console.log('='.repeat(100));
  
  // Clear any remaining content below
  clearFromLine(20);
}

function displayPhotoProgressBelowTable(gallery, photoIndex, facesFound, startTime) {
  const elapsed = Date.now() - startTime;
  const avgTime = elapsed / photoIndex;
  const remaining = (gallery.photos.length - photoIndex) * avgTime;
  const eta = Math.ceil(remaining / 1000); // seconds
  const currentTime = new Date().toLocaleTimeString();
  
  // Move cursor to line 15 (below the gallery table)
  process.stdout.write('\x1b[15;0H');
  
  // Clear from this line down
  clearFromLine(15);
  
  console.log(`\n🎯 Current Gallery: ${gallery.albumCode}`);
  console.log(`⏰ ${currentTime} | 📸 Photo: ${photoIndex}/${gallery.photos.length} | 😊 Faces: ${facesFound} | ⏱️ ETA: ${eta}s`);
  
  const percent = Math.round((photoIndex / gallery.photos.length) * 100);
  const filledBlocks = Math.floor(percent / 2);
  const emptyBlocks = 50 - filledBlocks;
  const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  
  // Animated progress bar with current position indicator
  const position = Math.floor((photoIndex / gallery.photos.length) * 50);
  const animatedBar = '█'.repeat(position) + '🔥' + '░'.repeat(50 - position - 1);
  
  console.log(`📊 Progress: [${progressBar}] ${percent}%`);
  console.log(`🔥 Current: [${animatedBar}]`);
  
  console.log('\n📈 Real-time Statistics:');
  console.log(`   📁 Total Photos: ${gallery.photos.length}`);
  console.log(`   ✅ Processed: ${photoIndex} (${Math.round((photoIndex / gallery.photos.length) * 100)}%)`);
  console.log(`   😊 Faces Found: ${facesFound} (avg: ${(facesFound / photoIndex).toFixed(1)} per photo)`);
  console.log(`   ⏱️ Time Elapsed: ${Math.round(elapsed / 1000)}s (${Math.round(avgTime)}ms per photo)`);
  console.log(`   🎯 Est. Remaining: ${eta}s (${Math.round(remaining / 1000 / 60)}min)`);
  console.log(`   🚀 Processing Speed: ${(photoIndex / (elapsed / 1000)).toFixed(2)} photos/sec`);
  
  console.log('\n' + '='.repeat(100));
  console.log('🔄 Processing next photo... (2s delay for AWS rate limiting)');
}

function displayPhotoProgress(gallery, photoIndex, facesFound, startTime) {
  // Keep this function for initial display or other uses
  displayPhotoProgressBelowTable(gallery, photoIndex, facesFound, startTime);
}

// Update the main indexing function to use table display
async function indexAllGalleries() {
  console.log('🔍 Fetching galleries...');
  const allGalleries = await getGalleries();
  
  // Filter galleries that need indexing
  const galleriesNeedingIndexing = allGalleries.filter(gallery => {
    // Skip if no photos
    if (!gallery.photos || gallery.photos.length === 0) {
      console.log(`⏭️  Skipping ${gallery.albumCode} - no photos`);
      return false;
    }
    
    // Skip if face recognition is disabled
    if (!gallery.faceRecognitionEnabled) {
      console.log(`⏭️  Skipping ${gallery.albumCode} - face recognition disabled`);
      return false;
    }
    
    // Skip if already completed or in progress
    const indexing = gallery.faceIndexing || {};
    if (indexing.status === 'completed') {
      console.log(`✅ Skipping ${gallery.albumCode} - already completed (${indexing.indexedPhotos || 0}/${gallery.photos.length} photos indexed)`);
      return false;
    }
    
    if (indexing.status === 'in_progress') {
      console.log(`🔄 Resuming ${gallery.albumCode} - continuing from photo ${(indexing.indexedPhotos || 0) + 1} (${indexing.indexedPhotos || 0}/${gallery.photos.length} photos indexed)`);
      return true;
    }
    
    // Check if needs indexing
    const needsIndexing = !gallery.faceIndexing || 
                         gallery.faceIndexing.status !== 'completed' ||
                         gallery.faceIndexing.indexedPhotos < gallery.photos.length;
    
    if (!needsIndexing) {
      console.log(`✅ Skipping ${gallery.albumCode} - already indexed`);
      return false;
    }
    
    return true;
  });
  
  console.log(`\n📊 Found ${galleriesNeedingIndexing.length} galleries needing indexing out of ${allGalleries.length} total`);
  
  if (galleriesNeedingIndexing.length === 0) {
    console.log('🎉 All galleries are already indexed or skipped!');
    return;
  }
  
  displayGalleryTable(allGalleries);
  
  for (let i = 0; i < galleriesNeedingIndexing.length; i++) {
    const gallery = galleriesNeedingIndexing[i];
    
    // Get current progress
    const currentIndexing = gallery.faceIndexing || {};
    const startIndex = currentIndexing.indexedPhotos || 0;
    
    if (startIndex > 0) {
      console.log(`� Resuming indexing for ${gallery.albumCode} from photo ${startIndex + 1} (${gallery.photos.length} photos total)`);
    } else {
      console.log(`🚀 Starting indexing for ${gallery.albumCode} (${gallery.photos.length} photos)`);
    }
    
    await ensureCollection(gallery.albumCode);
    
    let indexedCount = startIndex;
    let totalFacesFound = 0;
    const startTime = Date.now();
    
    // Update status to in_progress (don't reset progress)
    await updateGalleryStatus(gallery.albumCode, 'in_progress', indexedCount, gallery.photos.length);
    
    for (let j = startIndex; j < gallery.photos.length; j++) {
      const photo = gallery.photos[j];
      const photoIndex = j + 1;
      
      try {
        console.log(`[${gallery.albumCode}] Processing photo ${photoIndex}/${gallery.photos.length}`);
        
        const imageBuffer = await downloadAndResizeImage(photo.url);
        
        const command = new IndexFacesCommand({
          CollectionId: `gallery-${gallery.albumCode}`,
          Image: { Bytes: imageBuffer },
          ExternalImageId: `photo-${photoIndex - 1}`, // Use 0-based index to match face search
          MaxFaces: 10,
          QualityFilter: 'AUTO'
        });
        
        const result = await rekognitionClient.send(command);
        indexedCount++;
        const facesInPhoto = result.FaceRecords?.length || 0;
        totalFacesFound += facesInPhoto;
        
        console.log(`[${gallery.albumCode}] Photo ${photoIndex}: Indexed ${facesInPhoto} faces`);
        
        // Update server progress
        await updateGalleryStatus(gallery.albumCode, 'in_progress', indexedCount, gallery.photos.length);
        
        // Update gallery table display first (stays at top)
        const updatedGalleries = await getGalleries();
        displayGalleryTable(updatedGalleries, gallery, i, indexedCount);
        
        // Then show photo progress below the table
        displayPhotoProgressBelowTable(gallery, photoIndex, totalFacesFound, startTime);
        
        // Brief pause to show the update before next photo
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Delay to avoid AWS rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing photo ${photoIndex}:`, error.message);
        // Continue with next photo
      }
    }
    
    // Mark as completed
    await updateGalleryStatus(gallery.albumCode, 'completed', indexedCount, gallery.photos.length);
    
    // Final display for completed gallery
    const finalGalleries = await getGalleries();
    displayGalleryTable(finalGalleries);
    
    console.log(`🎉 Completed indexing ${gallery.albumCode}: ${indexedCount}/${gallery.photos.length} photos, ${totalFacesFound} faces found`);
    
    // Brief pause between galleries
    if (i < galleriesNeedingIndexing.length - 1) {
      console.log('⏸️  Brief pause before next gallery...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  clearScreen();
  displayHeader();
  console.log('🏆 ALL GALLERIES PROCESSED SUCCESSFULLY!');
  console.log('='.repeat(100));
}

// Start indexing
console.log('🎯 Starting accurate indexing with smart resume capability...');
indexAllGalleries().catch(console.error);

