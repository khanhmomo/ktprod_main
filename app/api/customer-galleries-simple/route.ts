import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('SIMPLE: POST request received');
  
  try {
    console.log('SIMPLE: Reading body...');
    const body = await request.json();
    console.log('SIMPLE: Body received:', body);
    
    console.log('SIMPLE: Creating response...');
    const response = NextResponse.json({
      success: true,
      message: 'Simple POST successful',
      received: body
    });
    
    console.log('SIMPLE: Response created, returning...');
    return response;
    
  } catch (error) {
    console.error('SIMPLE: Error:', error);
    
    try {
      return NextResponse.json({
        success: false,
        error: 'Simple POST failed',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    } catch (jsonError) {
      console.error('SIMPLE: JSON error:', jsonError);
      return new NextResponse('Simple POST failed', { status: 500 });
    }
  }
}
