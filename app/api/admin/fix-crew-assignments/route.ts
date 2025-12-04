import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ShootingEvent from '@/models/ShootingEvent';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Find all events that have crewAssignments
    const events = await ShootingEvent.find({
      crewAssignments: { $exists: true, $ne: [] }
    });
    
    console.log('Found events with crewAssignments:', events.length);
    
    let fixedCount = 0;
    
    for (const event of events) {
      // Extract crew IDs from crewAssignments and convert to strings
      const crewIds = event.crewAssignments.map((ca: any) => {
        const crewId = ca.crewId;
        // Handle both ObjectId and string types
        return typeof crewId === 'object' ? crewId.toString() : crewId;
      });
      
      console.log(`Event ${event._id}: crewIds =`, crewIds);
      
      // Update the event with assignedCrew as strings
      const updatedEvent = await ShootingEvent.findByIdAndUpdate(
        event._id, 
        { assignedCrew: crewIds },
        { new: true }
      );
      
      if (updatedEvent) {
        console.log(`Fixed event ${event._id}: assignedCrew =`, updatedEvent.assignedCrew);
        fixedCount++;
      }
    }
    
    return NextResponse.json({ 
      message: `Fixed ${fixedCount} events`,
      eventsFixed: fixedCount 
    });
    
  } catch (error) {
    console.error('Error fixing events:', error);
    return NextResponse.json(
      { error: 'Failed to fix events' },
      { status: 500 }
    );
  }
}
