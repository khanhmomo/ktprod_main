import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Crew } from '@/models/Crew';

// GET /api/auth/me - Get current user info
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

    // Handle traditional admin account (not in database)
    if (auth.user?.id === 'admin-traditional') {
      return NextResponse.json({
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
        role: auth.user.role,
        permissions: ['all'],
        isActive: true
      });
    }

    await dbConnect();

    // Get user from database for Google OAuth users
    const user = await Crew.findOne({ email: auth.user?.email })
      .select('-googleId');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      specialties: user.specialties
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
