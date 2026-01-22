import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerGallery from '@/models/CustomerGallery';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting face recognition migration...');
    
    await connectDB();
    
    // Find all galleries that don't have faceRecognitionEnabled field
    const galleriesToUpdate = await CustomerGallery.find({
      faceRecognitionEnabled: { $exists: false }
    });

    console.log(`📊 Found ${galleriesToUpdate.length} galleries to update`);

    if (galleriesToUpdate.length === 0) {
      console.log('✅ All galleries already have faceRecognitionEnabled field');
      return NextResponse.json({
        success: true,
        message: 'All galleries already have faceRecognitionEnabled field',
        updatedCount: 0
      });
    }

    // Update all galleries to have faceRecognitionEnabled: true by default
    const result = await CustomerGallery.updateMany(
      { faceRecognitionEnabled: { $exists: false } },
      { $set: { faceRecognitionEnabled: true } }
    );

    console.log(`🎉 Successfully updated ${result.modifiedCount} galleries`);

    // Verify the update
    const remainingGalleries = await CustomerGallery.find({
      faceRecognitionEnabled: { $exists: false }
    });

    const success = remainingGalleries.length === 0;

    return NextResponse.json({
      success,
      message: success 
        ? `Successfully updated ${result.modifiedCount} galleries with face recognition enabled by default`
        : `Updated ${result.modifiedCount} galleries, but ${remainingGalleries.length} still need updates`,
      updatedCount: result.modifiedCount,
      remainingCount: remainingGalleries.length
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
