import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import GalleryImage from '@/models/GalleryImage';
import { isAuthenticated } from '@/lib/server-auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const authCheck = await isAuthenticated();
    if (!authCheck) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { id } = params;
    const data = await request.json();
    
    await dbConnect();
    
    const updatedImage = await GalleryImage.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    
    if (!updatedImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error('Error updating gallery image:', error);
    return NextResponse.json(
      { error: 'Failed to update gallery image' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const authCheck = await isAuthenticated();
    if (!authCheck) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { id } = params;
    
    await dbConnect();
    
    const deletedImage = await GalleryImage.findByIdAndDelete(id);
    
    if (!deletedImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json(
      { error: 'Failed to delete gallery image' },
      { status: 500 }
    );
  }
}
