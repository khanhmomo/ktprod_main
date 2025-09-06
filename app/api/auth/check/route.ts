import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server-auth';

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    return NextResponse.json({ authenticated });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Error checking authentication status' },
      { status: 500 }
    );
  }
}
