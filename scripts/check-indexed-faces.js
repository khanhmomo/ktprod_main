const { RekognitionClient, ListFacesCommand } = require('@aws-sdk/client-rekognition');

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

async function checkIndexedFaces() {
  const collectionId = 'gallery-tum9l9qc';
  
  try {
    const command = new ListFacesCommand({
      CollectionId: collectionId,
      MaxResults: 100
    });
    
    const response = await rekognitionClient.send(command);
    const faces = response.Faces || [];
    
    console.log(`Collection: ${collectionId}`);
    console.log(`Total indexed faces: ${faces.length}`);
    console.log('Face details:');
    faces.forEach((face, index) => {
      console.log(`  ${index + 1}. ExternalId: ${face.ExternalImageId}, FaceId: ${face.FaceId}`);
    });
    
  } catch (error) {
    console.error('Error checking indexed faces:', error);
  }
}

checkIndexedFaces();
