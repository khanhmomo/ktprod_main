import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticate } from '@/lib/server-auth';

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || '*';
  
  try {
    const { username, password } = await request.json();
    const result = await authenticate(username, password);
    
    if (result.success) {
      const response = NextResponse.json(
        { success: true },
        { 
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
      
      // Set the secure flag in production
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Set the cookie with proper attributes in the response
      response.cookies.set({
        name: 'isAuthenticated',
        value: 'true',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      // Set user info cookie for traditional login
      response.cookies.set('user', JSON.stringify({
        id: 'admin-traditional',
        email: 'admin@company.com',
        name: 'System Administrator',
        role: 'super_admin'
      }), {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      return response;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: result.error || 'Authentication failed' 
      },
      { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  } catch (error: unknown) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred during login',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}
