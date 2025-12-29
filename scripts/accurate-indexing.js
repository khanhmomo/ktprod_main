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
      res.on('data', () => {});
      res.on('end', () => resolve());
    });

    req.on('error', reject);
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
          
          const resizedImage = await sharp(imageBuffer)
            .resize(800, 800, { 
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toBuffer();
          
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

// Main indexing function
async function indexAllGalleries() {
  console.log('Fetching galleries...');
  const galleries = await getGalleries();
  
  for (const gallery of galleries) {
    if (!gallery.photos || gallery.photos.length === 0) {
      console.log(`Skipping ${gallery.albumCode} - no photos`);
      continue;
    }
    
    const needsIndexing = !gallery.faceIndexing || 
                     gallery.faceIndexing.status !== 'completed' ||
                     gallery.faceIndexing.indexedPhotos < gallery.photos.length;
    
    if (!needsIndexing) {
      console.log(`Skipping ${gallery.albumCode} - already indexed`);
      continue;
    }
    
    console.log(`Starting indexing for ${gallery.albumCode} (${gallery.photos.length} photos)`);
    
    await ensureCollection(gallery.albumCode);
    await updateGalleryStatus(gallery.albumCode, 'in_progress', 0, gallery.photos.length);
    
    let indexedCount = 0;
    
    for (let i = 0; i < gallery.photos.length; i++) {
      const photo = gallery.photos[i];
      const photoIndex = i + 1;
      
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
        console.log(`[${gallery.albumCode}] Photo ${photoIndex}: Indexed ${result.FaceRecords?.length || 0} faces`);
        
        // Update progress
        await updateGalleryStatus(gallery.albumCode, 'in_progress', indexedCount, gallery.photos.length);
        
        // Delay to avoid AWS rate limiting (like your original script)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing photo ${photoIndex}:`, error.message);
        // Continue with next photo
      }
    }
    
    // Mark as completed
    await updateGalleryStatus(gallery.albumCode, 'completed', indexedCount, gallery.photos.length);
    console.log(`Completed indexing ${gallery.albumCode}: ${indexedCount}/${gallery.photos.length} photos`);
  }
  
  console.log('All galleries processed!');
}

// Start indexing
console.log('Starting accurate indexing...');
indexAllGalleries().catch(console.error);

