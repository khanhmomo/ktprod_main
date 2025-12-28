import { RekognitionClient, RekognitionClientConfig } from '@aws-sdk/client-rekognition';
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

// Base AWS Configuration
const baseConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

// Rekognition Configuration
const rekognitionConfig: RekognitionClientConfig = baseConfig;

// S3 Configuration
const s3Config: S3ClientConfig = baseConfig;

// DynamoDB Configuration
const dynamoConfig: DynamoDBClientConfig = baseConfig;

// AWS Clients
export const rekognitionClient = new RekognitionClient(rekognitionConfig);
export const s3Client = new S3Client(s3Config);
export const dynamoClient = new DynamoDBClient(dynamoConfig);

export default {
  rekognitionClient,
  s3Client,
  dynamoClient
};
