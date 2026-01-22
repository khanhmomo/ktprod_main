import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Crew } from '@/models/Crew';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const allCrew = await Crew.find({});
    const activeCrew = await Crew.find({ isActive: true });
    
    return NextResponse.json({
      total: allCrew.length,
      active: activeCrew.length,
      crew: activeCrew.map(c => ({ name: c.name, email: c.email, role: c.role }))
    });
  } catch (error) {
    console.error('Error checking crew:', error);
    return NextResponse.json({ error: 'Failed to check crew' }, { status: 500 });
  }
}
