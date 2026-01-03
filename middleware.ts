import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Allow business galleries to be embedded in iframes on any domain
  if (request.nextUrl.pathname.startsWith('/business-gallery')) {
    // Remove any existing CSP headers
    response.headers.delete('Content-Security-Policy');
    response.headers.delete('X-Frame-Options');
    
    // Add permissive headers for iframe embedding
    response.headers.set('X-Frame-Options', 'ALLOWALL');
    response.headers.set('Content-Security-Policy', "frame-ancestors *; default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:;");
    
    // Add CORS headers to allow cross-origin requests
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  return response;
}

export const config = {
  matcher: ['/business-gallery/:path*'],
};
