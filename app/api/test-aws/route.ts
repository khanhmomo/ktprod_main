import { NextRequest, NextResponse } from 'next/server';
import { RekognitionClient, ListCollectionsCommand } from '@aws-sdk/client-rekognition';

export async function GET() {
  try {
    console.log('Testing AWS Rekognition connection...');
    
    // Debug environment variables
    console.log('AWS_ACCESS_KEY_ID exists:', !!process.env.AWS_ACCESS_KEY_ID);
    console.log('AWS_SECRET_ACCESS_KEY exists:', !!process.env.AWS_SECRET_ACCESS_KEY);
    console.log('AWS_REGION:', process.env.AWS_REGION);
    
    const client = new RekognitionClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new ListCollectionsCommand({ MaxResults: 10 });
    const response = await client.send(command);
    
    return NextResponse.json({
      success: true,
      collections: response.CollectionIds || [],
      count: response.CollectionIds?.length || 0
    });

  } catch (error: any) {
    console.error('AWS Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
