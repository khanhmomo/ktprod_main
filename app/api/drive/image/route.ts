import { NextResponse } from 'next/server';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
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
    
    log('Request received', { fileId });
    
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
    
    // Construct the direct Google Drive image URL
    const imageUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    log('Fetching image from Google Drive', { imageUrl });
    
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
