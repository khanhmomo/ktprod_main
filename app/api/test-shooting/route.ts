import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import dbConnect from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('Test endpoint - starting...');
    
    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      console.log('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('Authentication passed');

    await dbConnect();
    console.log('Database connected');
    
    const body = await request.json();
    console.log('Test endpoint - received body:', body);
    
    return NextResponse.json({ 
      message: 'Test endpoint working',
      received: body,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: 'Test endpoint failed', details: errorMessage },
      { status: 500 }
    );
  }
}
