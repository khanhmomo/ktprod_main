import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerGallery from '@/models/CustomerGallery';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumCode: string }> }
) {
  try {
    const { albumCode } = await params;
    
    await connectDB();
    
    // This endpoint is just to trigger the home server monitor
    // The actual monitoring happens in the home server app
    console.log(`🎯 Trigger check requested for album: ${albumCode}`);
    
    // We could add logic here to notify the home server immediately
    // For now, this is just a placeholder that returns success
    
    return NextResponse.json({ 
      message: 'Check triggered successfully',
      albumCode: albumCode,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error triggering check:', error);
    return NextResponse.json(
      { error: 'Failed to trigger check' },
      { status: 500 }
    );
  }
}
