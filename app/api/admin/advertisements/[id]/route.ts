import { NextResponse } from 'next/server';
import Advertisement from '@/models/Advertisement';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    
    const ad = await Advertisement.findByIdAndUpdate(
      params.id,
      {
        title: data.title,
        content: data.content,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive,
        imageUrl: data.imageUrl || null,
        ctaText: data.ctaText || null,
        ctaLink: data.ctaLink || null,
      },
      { new: true }
    );

    if (!ad) {
      return NextResponse.json({ error: 'Advertisement not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: ad._id.toString(),
      title: ad.title,
      content: ad.content,
      startDate: ad.startDate.toISOString(),
      endDate: ad.endDate.toISOString(),
      isActive: ad.isActive,
      imageUrl: ad.imageUrl,
      ctaText: ad.ctaText,
      ctaLink: ad.ctaLink,
      createdAt: ad.createdAt.toISOString(),
      updatedAt: ad.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error updating ad:', error);
    return NextResponse.json(
      { error: 'Failed to update advertisement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const ad = await Advertisement.findByIdAndDelete(params.id);
    
    if (!ad) {
      return NextResponse.json({ error: 'Advertisement not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { error: 'Failed to delete advertisement' },
      { status: 500 }
    );
  }
}
