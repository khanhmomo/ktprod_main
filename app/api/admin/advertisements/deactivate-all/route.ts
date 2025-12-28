import { NextResponse } from 'next/server';
import Advertisement from '@/models/Advertisement';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';

export async function POST() {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Deactivate all advertisements
    await Advertisement.updateMany(
      { isActive: true },
      { isActive: false }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating ads:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate advertisements' },
      { status: 500 }
    );
  }
}
