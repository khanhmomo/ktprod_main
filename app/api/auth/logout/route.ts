import { NextResponse } from 'next/server';
import { logout } from '@/lib/server-auth';

export async function POST() {
  try {
    const result = await logout();
    
    if (result.success) {
      const response = NextResponse.json(
        { success: true },
        { status: 200 }
      );
      
      // Set the cookie in the response headers
      if (result.headers) {
        const setCookie = result.headers.get('Set-Cookie');
        if (setCookie) {
          response.headers.set('Set-Cookie', setCookie);
        }
      }
      
      return response;
    }
    
    return NextResponse.json(
      { success: false, error: result.error || 'Logout failed' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
