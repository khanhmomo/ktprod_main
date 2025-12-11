import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Showcase } from '@/models/Showcase';

// GET /api/showcase - Get all showcase items
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const query = activeOnly ? { isActive: true } : {};
    const showcaseItems = await Showcase.find(query)
      .sort({ order: 1, createdAt: -1 });

    return NextResponse.json(showcaseItems);
  } catch (error) {
    console.error('Error fetching showcase items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcase items' },
      { status: 500 }
    );
  }
}

// POST /api/showcase - Create new showcase item
export async function POST(request: NextRequest) {
  try {
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
    const { imageUrl, order } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const showcaseItem = new Showcase({
      imageUrl,
      order: order || 0
    });

    await showcaseItem.save();

    return NextResponse.json(showcaseItem, { status: 201 });
  } catch (error) {
    console.error('Error creating showcase item:', error);
    return NextResponse.json(
      { error: 'Failed to create showcase item' },
      { status: 500 }
    );
  }
}
