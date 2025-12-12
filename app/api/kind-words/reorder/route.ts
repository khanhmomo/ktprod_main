import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import KindWord from '@/models/KindWord';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { words } = body;
    
    if (!words || !Array.isArray(words)) {
      return NextResponse.json(
        { error: 'Words array is required' },
        { status: 400 }
      );
    }
    
    // Update each word's order
    const updatePromises = words.map(({ id, order }: { id: string; order: number }) => 
      KindWord.findByIdAndUpdate(id, { order }, { new: true })
    );
    
    await Promise.all(updatePromises);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering kind words:', error);
    return NextResponse.json(
      { error: 'Failed to reorder kind words' },
      { status: 500 }
    );
  }
}
