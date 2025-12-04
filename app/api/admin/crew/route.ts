import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Crew } from '@/models/Crew';

// GET /api/admin/crew - Fetch all crew members (super admin only)
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/crew - Starting request');
    
    // Check if user is authenticated and is super admin
    const auth = await getCurrentUser();
    console.log('Auth result:', auth);
    
    if (!auth.success) {
      console.log('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get current user to check if they're super admin
    let currentUser;
    
    // Handle traditional admin account
    if (auth.user?.id === 'admin-traditional') {
      currentUser = { role: 'super_admin' };
    } else {
      currentUser = await Crew.findOne({ email: auth.user?.email });
    }
    
    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const crew = await Crew.find({ isActive: true })
      .select('-googleId')
      .sort({ name: 1 });
    
    console.log('Found crew members:', crew.length);
    
    return NextResponse.json(crew);
  } catch (error) {
    console.error('Error fetching crew:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crew members' },
      { status: 500 }
    );
  }
}

// POST /api/admin/crew - Create new crew member (super admin only)
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/crew - Starting crew creation');
    
    const auth = await getCurrentUser();
    console.log('Auth check result:', auth);
    
    if (!auth.success) {
      console.log('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected');

    // Get current user to check if they're super admin
    let currentUser;
    
    // Handle traditional admin account
    if (auth.user?.id === 'admin-traditional') {
      currentUser = { role: 'super_admin' };
      console.log('Traditional admin account detected');
    } else {
      currentUser = await Crew.findOne({ email: auth.user?.email });
      console.log('Current user found:', currentUser?.email, 'Role:', currentUser?.role);
    }
    
    if (!currentUser || currentUser.role !== 'super_admin') {
      console.log('Insufficient permissions');
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { email, name, role, permissions, phone, specialties } = body;

    if (!email || !name) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Check if crew member already exists
    console.log('Checking if crew member already exists for email:', email.toLowerCase());
    const existingCrew = await Crew.findOne({ email: email.toLowerCase() });
    console.log('Existing crew member:', existingCrew);
    
    if (existingCrew) {
      console.log('Crew member already exists');
      return NextResponse.json(
        { error: 'Crew member with this email already exists' },
        { status: 400 }
      );
    }

    console.log('Creating new crew member...');
    const crewMember = new Crew({
      email: email.toLowerCase(),
      name,
      role: role || 'crew',
      permissions: permissions || [],
      phone,
      specialties: specialties || []
    });

    console.log('Saving crew member to database...');
    await crewMember.save();
    console.log('Crew member created successfully:', crewMember);

    return NextResponse.json(crewMember, { status: 201 });
  } catch (error) {
    console.error('Error creating crew member:', error);
    return NextResponse.json(
      { error: 'Failed to create crew member', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
