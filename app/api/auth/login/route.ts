import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const result = await authenticate(username, password);
    
    if (result.success) {
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: result.error || 'Authentication failed' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
