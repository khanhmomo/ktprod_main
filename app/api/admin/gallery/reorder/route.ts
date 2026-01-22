import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import GalleryImage from '@/models/GalleryImage';
import { isAuthenticated } from '@/lib/server-auth';

export async function PUT(request: Request) {
  try {
    // Check if user is authenticated
    const authCheck = await isAuthenticated();
    if (!authCheck) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { updates } = await request.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid updates format' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Update each image's order
    const bulkOps = updates.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order } },
      },
    }));
    
    await GalleryImage.bulkWrite(bulkOps);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering gallery images:', error);
    return NextResponse.json(
      { error: 'Failed to reorder gallery images' },
      { status: 500 }
    );
  }
}
