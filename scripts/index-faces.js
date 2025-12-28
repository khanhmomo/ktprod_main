const { RekognitionClient, CreateCollectionCommand, IndexFacesCommand } = require('@aws-sdk/client-rekognition');
const sharp = require('sharp');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Debug credentials
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Found' : 'Not found');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Found' : 'Not found');
console.log('AWS_REGION:', process.env.AWS_REGION);

// AWS Configuration
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  },
});

// Simple face collection service
class FaceCollectionService {
  static async createCollection(collectionId) {
    try {
      const command = new CreateCollectionCommand({ CollectionId: collectionId });
      await rekognitionClient.send(command);
      console.log('Face collection created:', collectionId);
      return collectionId;
    } catch (error) {
      if (error.name === 'ResourceAlreadyExistsException') {
        console.log('Collection already exists:', collectionId);
        return collectionId;
      }
      throw error;
    }
  }

  static async indexFaces(collectionId, imageBytes, externalImageId) {
    try {
      // Resize image to be under 5MB and optimize for face detection
      const resizedImage = await sharp(imageBytes)
        .resize(1024, 1024, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      const command = new IndexFacesCommand({
        CollectionId: collectionId,
        Image: { Bytes: resizedImage },
        ExternalImageId: externalImageId,
        DetectionAttributes: ['ALL'],
        MaxFaces: 1,
        QualityFilter: 'AUTO',
      });

      const response = await rekognitionClient.send(command);
      const faceRecords = response.FaceRecords || [];
      console.log(`Indexed ${faceRecords.length} faces for ${externalImageId}`);
      return faceRecords;
    } catch (error) {
      console.error('Error indexing faces:', error);
      throw error;
    }
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// MongoDB connection
const mongoose = require('mongoose');

async function dbConnect() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
}

// CustomerGallery schema
const customerGallerySchema = new mongoose.Schema({
  albumCode: String,
  status: String,
  isActive: Boolean,
  photos: [{
    url: String,
    alt: String
  }]
});

const CustomerGallery = mongoose.model('CustomerGallery', customerGallerySchema);

async function indexFaces() {
  await dbConnect();
  const galleries = await CustomerGallery.find({ status: 'published' });
  
  // Process galleries in parallel (2 at a time)
  const galleryBatchSize = 2;
  for (let i = 0; i < galleries.length; i += galleryBatchSize) {
    const galleryBatch = galleries.slice(i, i + galleryBatchSize);
    const galleryPromises = galleryBatch.map(async (gallery) => {
      const collectionId = `gallery-${gallery.albumCode}`;
      await FaceCollectionService.createCollection(collectionId);
      
      // Process in batches of 10 photos at once (increased from 5)
      const batchSize = 10;
      for (let j = 0; j < gallery.photos.length; j += batchSize) {
        const batch = gallery.photos.slice(j, j + batchSize);
        const promises = batch.map(async (photo, batchIndex) => {
          const response = await fetch(photo.url);
          const imageBytes = Buffer.from(await response.arrayBuffer());
          await FaceCollectionService.indexFaces(collectionId, imageBytes, `photo-${j + batchIndex}`);
          console.log(`[${gallery.albumCode}] Indexed photo ${j + batchIndex + 1}/${gallery.photos.length}`);
        });
        
        await Promise.all(promises);
        console.log(`[${gallery.albumCode}] Completed batch ${Math.floor(j/batchSize) + 1}/${Math.ceil(gallery.photos.length/batchSize)}`);
      }
    });
    
    await Promise.all(galleryPromises);
    console.log(`Completed gallery batch ${Math.floor(i/galleryBatchSize) + 1}/${Math.ceil(galleries.length/galleryBatchSize)}`);
  }
}

indexFaces();