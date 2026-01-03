import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BusinessGallery from '@/models/BusinessGallery';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    albumCode: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { albumCode: string } }
) {
  try {
    await connectDB();
    
    const { albumCode } = await params;
    const gallery = await BusinessGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: { $in: ['published', 'draft'] },
      isActive: true 
    }).select('-faceIndexing');
    
    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(gallery);
  } catch (error) {
    console.error('Error fetching business gallery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}
