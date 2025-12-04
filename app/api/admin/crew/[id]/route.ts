import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Crew } from '@/models/Crew';

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
