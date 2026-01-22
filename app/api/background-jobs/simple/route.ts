import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== SIMPLE INDEXING JOB STARTED ===');
  
  try {
    const { albumCode } = await request.json();
    console.log('Simple indexing request for:', albumCode);
    
    // Just return success immediately to test if API is called
    return NextResponse.json({ 
      message: 'Simple indexing test successful',
      albumCode: albumCode
    });
    
  } catch (error) {
    console.error('Simple indexing error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
