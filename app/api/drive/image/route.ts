import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

// Handle OPTIONS method for CORS preflight
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Initialize Google Auth with environment variables
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

// Handle OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}

export async function GET(request: Request) {
  try {
    // Get the file ID from the query parameters
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return new NextResponse('File ID is required', { status: 400 });
    }

    // Get file metadata to check if it's an image
    const { data: file } = await drive.files.get({
      fileId,
      fields: 'mimeType,webContentLink,thumbnailLink',
    });

    if (!file.mimeType?.startsWith('image/')) {
      return new NextResponse('File is not an image', { status: 400 });
    }

    // Get the image data as a stream
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    ) as unknown as { data: Readable };

    // Convert the stream to a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.data) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...corsHeaders
      },
    });
  } catch (error) {
    console.error('Error fetching image from Google Drive:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
