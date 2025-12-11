import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Showcase } from '@/models/Showcase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user is authenticated and is admin
    const auth = await getCurrentUser();
    if (!auth.success || auth.user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { imageUrl, order, isActive } = body;

    const showcaseItem = await Showcase.findByIdAndUpdate(
      id,
      {
        imageUrl,
        order,
        isActive
      },
      { new: true, runValidators: true }
    );

    if (!showcaseItem) {
      return NextResponse.json(
        { error: 'Showcase item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(showcaseItem);
  } catch (error) {
    console.error('Error updating showcase item:', error);
    return NextResponse.json(
      { error: 'Failed to update showcase item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user is authenticated and is admin
    const auth = await getCurrentUser();
    if (!auth.success || auth.user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const showcaseItem = await Showcase.findByIdAndDelete(id);

    if (!showcaseItem) {
      return NextResponse.json(
        { error: 'Showcase item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Showcase item deleted successfully' });
  } catch (error) {
    console.error('Error deleting showcase item:', error);
    return NextResponse.json(
      { error: 'Failed to delete showcase item' },
      { status: 500 }
    );
  }
}
