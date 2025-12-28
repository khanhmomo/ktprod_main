import { rekognitionClient } from './aws-config';
import { CreateCollectionCommand, IndexFacesCommand, SearchFacesByImageCommand, DeleteCollectionCommand, ListCollectionsCommand } from '@aws-sdk/client-rekognition';

export class FaceCollectionService {
  // Create a face collection for an event
  static async createCollection(collectionId: string) {
    if (!rekognitionClient) {
      throw new Error('AWS Rekognition not configured');
    }
    
    try {
      const command = new CreateCollectionCommand({
        CollectionId: collectionId,
      });
      
      const response = await rekognitionClient.send(command);
      console.log('Face collection created:', collectionId);
      return collectionId;
    } catch (error: any) {
      if (error.name === 'ResourceAlreadyExistsException') {
        console.log('Collection already exists:', collectionId);
        return collectionId;
      }
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  // Index faces from images
  static async indexFaces(collectionId: string, imageBytes: Buffer, externalImageId: string) {
    if (!rekognitionClient) {
      throw new Error('AWS Rekognition not configured');
    }
    
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
      const faceRecords = response.FaceRecords || [];
      console.log(`Indexed ${faceRecords.length} faces for ${externalImageId}`);
      return faceRecords;
    } catch (error) {
      console.error('Error indexing faces:', error);
      throw error;
    }
  }

  // Search for faces
  static async searchFaces(collectionId: string, imageBytes: Buffer, maxFaces: number = 10, threshold: number = 85) {
    if (!rekognitionClient) {
      throw new Error('AWS Rekognition not configured');
    }
    
    try {
      const command = new SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: { Bytes: imageBytes },
        MaxFaces: maxFaces,
        FaceMatchThreshold: threshold, // 85% similarity threshold
        QualityFilter: 'AUTO',
      });

      const response = await rekognitionClient.send(command);
      const faceMatches = response.FaceMatches || [];
      console.log(`Found ${faceMatches.length} matching faces`);
      return faceMatches;
    } catch (error) {
      console.error('Error searching faces:', error);
      throw error;
    }
  }

  // List all collections
  static async listCollections() {
    if (!rekognitionClient) {
      throw new Error('AWS Rekognition not configured');
    }
    
    try {
      const command = new ListCollectionsCommand({
        MaxResults: 100,
      });

      const response = await rekognitionClient.send(command);
      return response.CollectionIds || [];
    } catch (error) {
      console.error('Error listing collections:', error);
      throw error;
    }
  }

  // Delete collection
  static async deleteCollection(collectionId: string) {
    if (!rekognitionClient) {
      throw new Error('AWS Rekognition not configured');
    }
    
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
