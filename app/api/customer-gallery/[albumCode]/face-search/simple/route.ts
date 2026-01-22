import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CustomerGallery from '@/models/CustomerGallery';
import { FaceCollectionService } from '@/lib/face-collection';

// Helper function to process Google Drive URLs
function processImageUrl(url: string): string {
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/(file)\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://drive.google.com/uc?export=view&id=${match[2]}`;
    }
  }
  return url;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumCode: string }> }
) {
  try {
    const { albumCode } = await params;
    const formData = await request.formData();
    const selfieFile = formData.get('selfie') as File;

    if (!selfieFile) {
      return NextResponse.json(
        { error: 'No selfie file provided' },
        { status: 400 }
      );
    }

    // Convert selfie to buffer
    const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());

    // Create collection ID based on album
    const collectionId = `gallery-${albumCode}`;
    
    // Create collection if it doesn't exist
    try {
      await FaceCollectionService.createCollection(collectionId);
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.error('Error creating collection:', error);
        return NextResponse.json(
          { error: 'Failed to create face collection' },
          { status: 500 }
        );
      }
    }

    // Search for matching faces
    const matches = await FaceCollectionService.searchFaces(
      collectionId,
      selfieBuffer,
      50, // Increase max faces to find
      60 // Lower threshold to 60% for much more matches
    );

    console.log(`AWS Rekognition found ${matches.length} raw face matches`);
    console.log('Match details:', matches.map((m: any) => ({
      similarity: m.Similarity,
      externalId: m.Face?.ExternalImageId,
      faceId: m.Face?.FaceId
    })));

    // Get gallery photos to match with face results
    await dbConnect();
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: { $in: ['published', 'draft'] },
      isActive: true 
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    // Map face matches to photo URLs
    const matchedPhotos = matches.map((match: any) => {
      const photoIndex = parseInt(match.Face?.ExternalImageId?.replace('photo-', '') || '0');
      const photo = gallery.photos[photoIndex];
      
      console.log(`Mapping match: ExternalId=${match.Face?.ExternalImageId} -> photoIndex=${photoIndex} -> hasPhoto=${!!photo}`);
      
      return {
        index: photoIndex,
        url: photo?.url || '',
        alt: photo?.alt || `Photo ${photoIndex + 1}`,
        confidence: match.Similarity || 0,
        boundingBox: match.Face?.BoundingBox,
        faceId: match.Face?.FaceId
      };
    }).filter((match: any) => match.url); // Filter out invalid matches

    console.log(`Final matched photos after filtering: ${matchedPhotos.length}`);

    console.log(`AWS Rekognition found ${matchedPhotos.length} matching photos`);

    // Return results
    return NextResponse.json({
      success: true,
      totalPhotos: gallery.photos.length,
      matchedPhotos: matchedPhotos.length,
      matches: matchedPhotos,
      message: `Found ${matchedPhotos.length} photos with your face!`
    });

  } catch (error) {
    console.error('AWS Rekognition face search error:', error);
    return NextResponse.json(
      { error: 'Face recognition service unavailable. Please try again later.' },
      { status: 500 }
    );
  }
}
