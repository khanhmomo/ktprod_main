import { NextResponse } from 'next/server';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
  const requestId = Math.random().toString(36).substring(2, 9);
  
  const log = (message: string, data?: any) => {
    console.log(`[${requestId}] ${message}`, data || '');
  };

  try {
    // Get the file ID from the query parameters
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const size = searchParams.get('size'); // 'small', 'medium', 'large', 'full'
    const download = searchParams.get('download'); // 'true' for full-size download
    
    log('Request received', { fileId, size, download });
    
    if (!fileId) {
      const error = 'File ID is required';
      log('Validation error', { error });
      
      return new NextResponse(
        JSON.stringify({ 
          error,
          requestId,
          timestamp: new Date().toISOString()
        }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // Smart sizing: default to medium for browsing, full only for downloads
    let imageUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    let cacheMaxAge = 31536000; // 1 year for all images
    
    if (download === 'true' || size === 'full') {
      // Full size only for explicit downloads
      imageUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      log('Fetching full-size image for download', { imageUrl });
    } else if (size === 'small') {
      // Small thumbnails
      imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=200`;
      cacheMaxAge = 31536000; // 1 year - thumbnails never change
      log('Using small thumbnail', { imageUrl });
    } else {
      // Default to medium size for browsing (800px - good balance)
      imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=800`;
      cacheMaxAge = 31536000; // 1 year
      log('Using medium size by default (cost optimization)', { imageUrl });
    }
    
    // Fetch the image from Google Drive
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*',
        'Referer': 'https://drive.google.com/'
      },
      redirect: 'follow'
    }).finally(() => clearTimeout(timeoutId));
    
    log('Response received', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      redirected: response.redirected,
      url: response.url,
      type: response.type
    });
    
    if (!response.ok) {
      const error = `Failed to fetch image: ${response.status} ${response.statusText}`;
      log('Fetch error', { error });
      
      // Try alternative URL format if the first one fails
      const alternativeUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      log('Trying alternative URL', { alternativeUrl });
      
      const altResponse = await fetch(alternativeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/*',
          'Referer': 'https://drive.google.com/'
        },
        redirect: 'follow'
      });
      
      if (!altResponse.ok) {
        throw new Error(`Both URL formats failed: ${response.status} and ${altResponse.status}`);
      }
      
      // If alternative URL worked, use that response
      const arrayBuffer = await altResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = altResponse.headers.get('content-type') || 'image/jpeg';
      
      log('Serving image from alternative URL', {
        contentType,
        size: buffer.length,
        duration: Date.now() - startTime
      });
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'X-Request-ID': requestId,
          'X-Image-Source': 'alternative',
          ...corsHeaders
        }
      });
    }
    
    // Get the image data and content type
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    log('Serving image', {
      contentType,
      size: buffer.length,
      duration: Date.now() - startTime
    });
    
    // Return the image with proper caching headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Request-ID': requestId,
        'X-Image-Source': 'primary',
        'Cache-Control': `public, max-age=${cacheMaxAge}, immutable`,
        ...corsHeaders
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? {
      name: error.name,
      stack: error.stack,
      cause: error.cause
    } : {};
    
    log('Error in image proxy', {
      error: errorMessage,
      ...errorDetails,
      duration: Date.now() - startTime
    });
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch image',
        message: errorMessage,
        requestId,
        timestamp: new Date().toISOString()
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
