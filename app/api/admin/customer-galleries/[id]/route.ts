import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CustomerGallery from '@/models/CustomerGallery';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await dbConnect();
    
    const gallery = await CustomerGallery.findById(id);
    
    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(gallery);
    
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    await dbConnect();
    
    const gallery = await CustomerGallery.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(gallery);
    
  } catch (error) {
    console.error('Error updating gallery:', error);
    return NextResponse.json(
      { error: 'Failed to update gallery' },
      { status: 500 }
    );
  }
}
