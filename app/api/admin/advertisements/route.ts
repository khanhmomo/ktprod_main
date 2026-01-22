import { NextResponse } from 'next/server';
import Advertisement from '@/models/Advertisement';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const ads = await Advertisement.find({}).sort({ createdAt: -1 });
    
    const formattedAds = ads.map(ad => ({
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
    }));

    return NextResponse.json(formattedAds);
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertisements' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    
    const ad = new Advertisement({
      title: data.title,
      content: data.content,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive,
      imageUrl: data.imageUrl || null,
      ctaText: data.ctaText || null,
      ctaLink: data.ctaLink || null,
    });

    await ad.save();

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
    console.error('Error creating ad:', error);
    return NextResponse.json(
      { error: 'Failed to create advertisement' },
      { status: 500 }
    );
  }
}
