import { NextResponse } from 'next/server';
import Advertisement from '@/models/Advertisement';
import dbConnect from '@/lib/db';

export async function GET() {
  try {
    await dbConnect();
    
    const now = new Date();
    
    const activeAd = await Advertisement.findOne({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ createdAt: -1 });

    if (!activeAd) {
      return NextResponse.json({ isActive: false });
    }

    return NextResponse.json({
      isActive: true,
      id: activeAd._id.toString(),
      title: activeAd.title,
      content: activeAd.content,
      startDate: activeAd.startDate.toISOString(),
      endDate: activeAd.endDate.toISOString(),
      imageUrl: activeAd.imageUrl,
      ctaText: activeAd.ctaText,
      ctaLink: activeAd.ctaLink,
      createdAt: activeAd.createdAt.toISOString(),
      updatedAt: activeAd.updatedAt.toISOString()
    });

  } catch (error) {
    console.error('Error fetching active ad:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active advertisement' },
      { status: 500 }
    );
  }
}
