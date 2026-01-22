import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ShootingEvent from '@/models/ShootingEvent';
import { Crew } from '@/models/Crew';

// GET /api/workspace/events - Get events assigned to current crew member
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const auth = await getCurrentUser();
    if (!auth.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get current user
    const currentUser = await Crew.findOne({ email: auth.user?.email });
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Build query
    const query: any = {
      'crewAssignments.crewId': currentUser._id
    };

    // Add month/year filter if provided
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      query.date = {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0]
      };
    }

    const events = await ShootingEvent.find(query)
      .populate('inquiryId', 'caseId name email subject')
      .populate('crewAssignments.crewId', 'name email')
      .sort({ date: 1, time: 1 });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching workspace events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
