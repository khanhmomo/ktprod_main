import { NextResponse } from 'next/server';
import { Chat, ChatMessage } from '@/models/Chat';
import dbConnect from '@/lib/db';
import { isAuthenticated } from '@/lib/server-auth';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chat = await Chat.findById(params.id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const messages = await ChatMessage.find({ chatId: params.id })
      .sort({ timestamp: 1 });

    // Mark customer messages as read
    await ChatMessage.updateMany(
      { chatId: params.id, senderType: 'customer', isRead: false },
      { isRead: true }
    );

    return NextResponse.json({
      chat,
      messages
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, adminId, assignToMe } = await request.json();

    const chat = await Chat.findById(params.id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (action === 'assign') {
      if (assignToMe) {
        // Assign to current user - we need to get current user info
        // For now, we'll use a placeholder - in a real app, you'd get the current user ID
        const currentUser = await getCurrentUser();
        if (currentUser.success && currentUser.user?.id) {
          chat.assignedTo = currentUser.user.id;
          chat.assignedBy = currentUser.user.id;
        } else {
          return NextResponse.json({ error: 'Could not identify current user' }, { status: 400 });
        }
      } else if (adminId) {
        chat.assignedTo = adminId;
        chat.assignedBy = null; // Will be set when we have proper user tracking
      }
      chat.status = 'assigned';
    } else if (action === 'close') {
      chat.status = 'closed';
      
      // Add system message to inform customer
      const systemMessage = new ChatMessage({
        chatId: params.id,
        senderType: 'admin',
        senderId: 'system',
        senderName: 'System',
        message: 'This chat has been ended. Thank you!',
        timestamp: new Date(),
        isRead: false
      });
      
      await systemMessage.save();
      
      // Update last message
      chat.lastMessage = 'This chat has been ended. Thank you!';
      chat.lastMessageTime = new Date();
      
    } else if (action === 'reopen') {
      chat.status = chat.assignedTo ? 'assigned' : 'active';
    }

    await chat.save();

    return NextResponse.json(await chat.populate('assignedTo assignedBy'));
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all messages associated with this chat
    await ChatMessage.deleteMany({ chatId: params.id });
    
    // Delete the chat
    const chat = await Chat.findByIdAndDelete(params.id);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
