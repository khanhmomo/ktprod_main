import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Inquiry from '@/models/Inquiry';
// @ts-ignore
const { emitToAdmins } = require('@/lib/socket-instance.js');

// PATCH /api/admin/inquiries/[id] - Update inquiry status or add reply note
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await dbConnect();

    const body = await request.json();
    const { status, replyNote, priority } = body;

    // Find the inquiry
    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return NextResponse.json(
        { message: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Update fields
    const updateData: any = {};

    if (status && ['unread', 'read', 'replied'].includes(status)) {
      updateData.status = status;
      
      // If marking as replied, set repliedAt timestamp
      if (status === 'replied') {
        updateData.repliedAt = new Date();
      }
    }

    if (replyNote !== undefined) {
      updateData.replyNote = replyNote;
    }

    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      updateData.priority = priority;
    }

    // Update the inquiry
    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedInquiry) {
      return NextResponse.json(
        { message: 'Inquiry not found after update' },
        { status: 404 }
      );
    }

    // Emit real-time notification to admin panel
    try {
      const eventData = {
        inquiry: updatedInquiry,
        stats: {
          total: await Inquiry.countDocuments(),
          unread: await Inquiry.countDocuments({ status: 'unread' }),
          read: await Inquiry.countDocuments({ status: 'read' }),
          replied: await Inquiry.countDocuments({ status: 'replied' })
        }
      };
      
      emitToAdmins('inquiry-updated', eventData);
      console.log('Real-time notification sent for inquiry update:', (updatedInquiry as any).caseId);
    } catch (socketError) {
      console.error('Error sending real-time notification:', socketError);
      // Don't fail the request if socket notification fails
    }

    return NextResponse.json({
      message: 'Inquiry updated successfully',
      inquiry: updatedInquiry
    });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/inquiries/[id] - Delete an inquiry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await dbConnect();

    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) {
      return NextResponse.json(
        { message: 'Inquiry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Inquiry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
