import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Crew } from '@/models/Crew';

// PUT /api/admin/crew/[id] - Update crew member (super admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT /api/admin/crew/[id] - Starting crew update for ID:', params.id);
    
    // Check if user is authenticated and is super admin
    const auth = await getCurrentUser();
    if (!auth.success) {
      console.log('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Find the crew member to update
    const crewMember = await Crew.findById(params.id);
    if (!crewMember) {
      console.log('Crew member not found');
      return NextResponse.json(
        { error: 'Crew member not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if new email already exists
    if (email.toLowerCase() !== crewMember.email.toLowerCase()) {
      console.log('Email is being changed, checking for conflicts');
      const existingCrew = await Crew.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: params.id } // Exclude current crew member from check
      });
      
      if (existingCrew) {
        console.log('Email already exists for another crew member');
        return NextResponse.json(
          { error: 'Crew member with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Update crew member
    console.log('Updating crew member...');
    crewMember.email = email.toLowerCase();
    crewMember.name = name;
    crewMember.role = role || 'crew';
    crewMember.permissions = permissions || [];
    crewMember.phone = phone;
    crewMember.specialties = specialties || [];

    console.log('Saving updated crew member to database...');
    await crewMember.save();
    console.log('Crew member updated successfully:', crewMember);

    return NextResponse.json(crewMember);
  } catch (error) {
    console.error('Error updating crew member:', error);
    return NextResponse.json(
      { error: 'Failed to update crew member', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/crew/[id] - Delete crew member (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is super admin
    const auth = await getCurrentUser();
    if (!auth.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check if current user is super admin
    const currentUser = await Crew.findOne({ email: auth.user?.email });
    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Don't allow deletion of super admin users
    const crewToDelete = await Crew.findById(params.id);
    if (!crewToDelete) {
      return NextResponse.json(
        { error: 'Crew member not found' },
        { status: 404 }
      );
    }

    if (crewToDelete.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete super admin users' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    crewToDelete.isActive = false;
    await crewToDelete.save();

    return NextResponse.json({ message: 'Crew member deleted successfully' });
  } catch (error) {
    console.error('Error deleting crew member:', error);
    return NextResponse.json(
      { error: 'Failed to delete crew member' },
      { status: 500 }
    );
  }
}
