import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';

// POST /api/admin/migrate-booking-schema - Migrate existing bookings to new schema
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    console.log('Starting booking schema migration...');
    
    // Find all bookings that might need schema updates
    const bookings = await Booking.find({});
    console.log(`Found ${bookings.length} bookings to check`);
    
    let updatedCount = 0;
    
    for (const booking of bookings) {
      let needsUpdate = false;
      
      // Add default payment status if missing
      if (!booking.paymentStatus) {
        booking.paymentStatus = 'pending';
        needsUpdate = true;
      }
      
      // Add default salary if missing
      if (booking.salary === undefined) {
        booking.salary = 0;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await booking.save();
        updatedCount++;
        console.log(`Updated booking ${booking._id}`);
      }
    }
    
    console.log(`Migration complete. Updated ${updatedCount} bookings.`);
    
    return NextResponse.json({ 
      message: 'Migration completed successfully',
      totalBookings: bookings.length,
      updatedBookings: updatedCount
    });
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed: ' + error.message },
      { status: 500 }
    );
  }
}
