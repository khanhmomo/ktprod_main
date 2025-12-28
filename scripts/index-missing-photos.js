const { RekognitionClient, IndexFacesCommand } = require('@aws-sdk/client-rekognition');
const sharp = require('sharp');

// AWS Configuration
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  },
});

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

async function indexMissingPhotos() {
  await dbConnect();
  
  const gallery = await CustomerGallery.findOne({ 
    albumCode: 'tum9l9qc',
    status: 'published' 
  });

  if (!gallery) {
    console.log('Gallery not found');
    return;
  }

  console.log(`Gallery has ${gallery.photos.length} photos`);
  
  // Index the missing photos (72 and 73)
  const missingIndices = [72, 73];
  const collectionId = 'gallery-tum9l9qc';

  for (const index of missingIndices) {
    if (index < gallery.photos.length) {
      const photo = gallery.photos[index];
      console.log(`Indexing photo-${index}: ${photo.url}`);
      
      try {
        const response = await fetch(photo.url);
        const imageBytes = Buffer.from(await response.arrayBuffer());
        
        // Resize image
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
          ExternalImageId: `photo-${index}`,
          DetectionAttributes: ['ALL'],
          MaxFaces: 1,
          QualityFilter: 'AUTO',
        });

        const result = await rekognitionClient.send(command);
        console.log(`Indexed photo-${index}: ${result.FaceRecords?.length || 0} faces`);
      } catch (error) {
        console.error(`Error indexing photo-${index}:`, error.message);
      }
    }
  }
}

indexMissingPhotos();
