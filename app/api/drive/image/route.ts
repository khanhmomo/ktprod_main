import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

// Debug logging function
const debug = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DriveImageAPI] ${message}`, data || '');
  }
};

// Handle OPTIONS method for CORS preflight
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Initialize Google Auth with environment variables
const getAuth = () => {
  try {
    const client_email = process.env.GOOGLE_CLIENT_EMAIL;
    const private_key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\\\n/g, '\n');
    
    if (!client_email || !private_key) {
      throw new Error('Missing required Google Drive API credentials');
    }

    debug('Initializing Google Auth with service account', { 
      client_email,
      has_private_key: !!private_key 
    });

    return new google.auth.GoogleAuth({
      credentials: {
        client_email,
        private_key,
      },
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ],
    });
  } catch (error) {
    console.error('Failed to initialize Google Auth:', error);
    throw new Error('Failed to initialize Google Drive authentication');
  }
};

const getDrive = () => {
  const auth = getAuth();
  return google.drive({ 
    version: 'v3', 
    auth,
    // Enable more detailed error messages
    validateStatus: () => true
  });
};

// Handle OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 8);
  
  const logRequest = (message: string, data?: any) => {
    debug(`[${requestId}] ${message}`, data);
  };

  try {
    // Get the file ID from the query parameters
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    
    logRequest('Request received', { fileId });

    if (!fileId) {
      logRequest('Missing file ID');
      return new NextResponse(JSON.stringify({ 
        error: 'File ID is required',
        requestId
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const drive = getDrive();
    
    // Get file metadata to check if it's an image
    logRequest('Fetching file metadata');
    const fileResponse = await drive.files.get({
      fileId,
      fields: 'id,name,mimeType,webViewLink,webContentLink,thumbnailLink,imageMediaMetadata',
    });
    
    const file = fileResponse.data;
    logRequest('File metadata received', { 
      mimeType: file.mimeType,
      name: file.name,
      hasThumbnail: !!file.thumbnailLink
    });

    if (!file.mimeType?.startsWith('image/')) {
      logRequest('File is not an image', { mimeType: file.mimeType });
      return new NextResponse(JSON.stringify({
        error: 'File is not an image',
        requestId,
        mimeType: file.mimeType
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If we have a direct web content link, use it
    if (file.webContentLink) {
      logRequest('Using webContentLink', { 
        webContentLink: file.webContentLink,
        duration: Date.now() - startTime
      });
      
      return new NextResponse(null, {
        status: 302,
        headers: {
          'Location': file.webContentLink,
          'Cache-Control': 'public, max-age=31536000, immutable',
          ...corsHeaders
        }
      });
    }
    
    // If we have a thumbnail, use it
    if (file.thumbnailLink) {
      logRequest('Using thumbnailLink', { 
        thumbnailLink: file.thumbnailLink,
        duration: Date.now() - startTime
      });
      
      return new NextResponse(null, {
        status: 302,
        headers: {
          'Location': file.thumbnailLink,
          'Cache-Control': 'public, max-age=31536000, immutable',
          ...corsHeaders
        }
      });
    }

    // As a last resort, download the file and serve it directly
    logRequest('Downloading file content directly');
    const { data } = await drive.files.get(
      { 
        fileId, 
        alt: 'media',
        supportsAllDrives: true,
        supportsTeamDrives: true
      },
      { 
        responseType: 'stream',
        timeout: 30000 // 30 second timeout
      }
    );

    const stream = data as unknown as Readable;
    const responseStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        stream.on('end', () => {
          controller.close();
          logRequest('File stream completed', { 
            duration: Date.now() - startTime 
          });
        });
        stream.on('error', (error) => {
          logRequest('Stream error', { error: error.message });
          controller.error(error);
        });
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': file.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Request-ID': requestId,
        ...corsHeaders
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? {
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } : {};
    
    logRequest('Error processing request', { 
      error: errorMessage,
      duration: Date.now() - startTime,
      ...errorDetails
    });
    
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to retrieve image from Google Drive',
        requestId,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }), 
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}
