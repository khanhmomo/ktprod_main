# AWS Rekognition Setup Guide

## Step 1: Create IAM User

1. Go to AWS Console → IAM → Users → Create user
2. User name: `rekognition-user`
3. Select "Access key - Programmatic access"
4. Click "Next"

## Step 2: Attach Policies

1. Click "Attach policies directly"
2. Search and select these policies:
   - `AmazonRekognitionFullAccess`
   - `AmazonS3FullAccess` (for storing face images)
   - `AmazonDynamoDBFullAccess` (for face metadata)

3. Click "Next" → "Create user"

## Step 3. Save Credentials

**IMPORTANT**: Save these credentials - you won't see the secret key again!
- **Access Key ID**: AKIA...
- **Secret Access Key**: abc...

## Step 4: Update Environment Variables

Add these to your `.env.local` file:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
AWS_REGION=us-east-1

# Optional: S3 Bucket for face images
AWS_S3_BUCKET=your-face-images-bucket
```

## Step 5: Install Dependencies

```bash
npm install @aws-sdk/client-rekognition @aws-sdk/client-s3 @aws-sdk/client-dynamodb
```

## Step 6: Create AWS Configuration

Create `/lib/aws-config.ts`:

```typescript
import { RekognitionClient, RekognitionClientConfig } from '@aws-sdk/client-rekognition';
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

// AWS Configuration
const config: RekognitionClientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

// AWS Clients
export const rekognitionClient = new RekognitionClient(config);
export const s3Client = new S3Client(config);
export const dynamoClient = new DynamoDBClient(config);

export default {
  rekognitionClient,
  s3Client,
  dynamoClient
};
```

## Step 7: Create Face Collection Service

Create `/lib/face-collection.ts`:

```typescript
import { rekognitionClient } from './aws-config';
import { CreateCollectionCommand, IndexFacesCommand, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition';

export class FaceCollectionService {
  // Create a face collection for an event
  static async createCollection(collectionId: string) {
    try {
      const command = new CreateCollectionCommand({
        CollectionId: collectionId,
      });
      
      const response = await rekognitionClient.send(command);
      console.log('Face collection created:', response.CollectionId);
      return response.CollectionId;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  // Index faces from images
  static async indexFaces(collectionId: string, imageBytes: Buffer, externalImageId: string) {
    try {
      const command = new IndexFacesCommand({
        CollectionId: collectionId,
        Image: { Bytes: imageBytes },
        ExternalImageId: externalImageId,
        DetectionAttributes: ['ALL'],
        MaxFaces: 1,
        QualityFilter: 'AUTO',
      });

      const response = await rekognitionClient.send(command);
      console.log(`Indexed ${response.FaceRecords.length} faces for ${externalImageId}`);
      return response.FaceRecords;
    } catch (error) {
      console.error('Error indexing faces:', error);
      throw error;
    }
  }

  // Search for faces
  static async searchFaces(collectionId: string, imageBytes: Buffer, maxFaces: number = 10) {
    try {
      const command = new SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: { Bytes: imageBytes },
        MaxFaces: maxFaces,
        FaceMatchThreshold: 85, // 85% similarity threshold
        QualityFilter: 'AUTO',
      });

      const response = await rekognitionClient.send(command);
      console.log(`Found ${response.FaceMatches.length} matching faces`);
      return response.FaceMatches;
    } catch (error) {
      console.error('Error searching faces:', error);
      throw error;
    }
  }

  // Delete collection
  static async deleteCollection(collectionId: string) {
    try {
      const command = new DeleteCollectionCommand({
        CollectionId: collectionId,
      });
      
      await rekognitionClient.send(command);
      console.log('Face collection deleted:', collectionId);
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }
}

export default FaceCollectionService;
```

## Step 8: Update Face Search API

Replace your current face search API with AWS Rekognition:

```typescript
import { FaceCollectionService } from '@/lib/face-collection';

// In your face search route:
export async function POST(request: NextRequest, { params }) {
  const { albumCode } = await params;
  const formData = await request.formData();
  const selfieFile = formData.get('selfie') as File;

  // Convert selfie to bytes
  const selfieBytes = Buffer.from(await selfieFile.arrayBuffer());
  
  // Create collection ID based on album
  const collectionId = `gallery-${albumCode}`;
  
  // Create collection if it doesn't exist
  try {
    await FaceCollectionService.createCollection(collectionId);
  } catch (error) {
    // Collection might already exist
    console.log('Collection already exists or error:', error.message);
  }

  // Search for matching faces
  const matches = await FaceCollectionService.searchFaces(
    collectionId,
    selfieBytes,
    10
  );

  // Return results
  return NextResponse.json({
    success: true,
    matches: matches.map(match => ({
      id: match.Face?.FaceId,
      confidence: match.Similarity,
      externalImageId: match.Face?.ExternalImageId,
      boundingBox: match.Face?.BoundingBox
    }))
  });
}
```

## Step 9: Index Existing Photos

Create a script to index all existing photos:

```typescript
// /scripts/index-faces.ts
import { FaceCollectionService } from '../lib/face-collection';
import CustomerGallery from '../models/CustomerGallery';
import dbConnect from '../lib/db';

async function indexAllFaces() {
  await dbConnect();
  
  const galleries = await CustomerGallery.find({ 
    status: 'published', 
    isActive: true 
  });

  for (const gallery of galleries) {
    console.log(`Processing gallery: ${gallery.albumCode}`);
    
    const collectionId = `gallery-${gallery.albumCode}`;
    
    // Create collection
    try {
      await FaceCollectionService.createCollection(collectionId);
    } catch (error) {
      console.log('Collection exists or error:', error.message);
    }

    // Index each photo
    for (let i = 0; i < gallery.photos.length; i++) {
      const photo = gallery.photos[i];
      
      try {
        // Download image
        const response = await fetch(photo.url);
        const imageBytes = Buffer.from(await response.arrayBuffer());
        
        // Index face
        await FaceCollectionService.indexFaces(
          collectionId,
          imageBytes,
          `photo-${i}`
        );
        
        console.log(`Indexed photo ${i + 1}/${gallery.photos.length}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error indexing photo ${i + 1}:`, error);
      }
    }
  }
  
  console.log('Face indexing complete!');
}

indexAllFaces().catch(console.error);
```

## Step 10: Run Face Indexing

```bash
# Run the indexing script
npx ts-node scripts/index-faces.ts
```

## Cost Considerations

- **AWS Rekognition**: $1.00 per 1,000 searches
- **Free Tier**: 1,000 searches/month
- **Storage**: Minimal (face metadata only)
- **Indexing**: Free (one-time cost)

## Testing

1. Upload a selfie to test face search
2. Check console logs for face detection
3. Verify matches are accurate
4. Test with different photos

## Troubleshooting

- **Access Denied**: Check IAM permissions
- **Region Error**: Verify AWS_REGION in .env.local
- **Collection Not Found**: Create collection first
- **No Faces Detected**: Check image quality and format

## Next Steps

1. Update your face search API with AWS Rekognition
2. Index existing gallery photos
3. Test the face recognition
4. Enjoy much higher accuracy face recognition!
