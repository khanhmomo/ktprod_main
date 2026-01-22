import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST: Background job API called ===');
    const body = await request.json();
    console.log('TEST: Received body:', body);
    
    return NextResponse.json({ 
      message: 'Test successful',
      received: body
    });
  } catch (error) {
    console.error('TEST: Error in background job:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
