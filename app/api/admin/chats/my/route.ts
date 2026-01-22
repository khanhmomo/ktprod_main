import { NextResponse } from 'next/server';
import { Chat, ChatMessage } from '@/models/Chat';
import dbConnect from '@/lib/db';
import { isAuthenticated } from '@/lib/server-auth';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.user?.id) {
      return NextResponse.json({ error: 'Could not identify current user' }, { status: 400 });
    }

    // Get chats assigned to current user
    const chats = await Chat.find({ assignedTo: currentUser.user.id })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ lastMessageTime: -1 });

    const chatDetails = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await ChatMessage.countDocuments({
          chatId: chat._id,
          senderType: 'customer',
          isRead: false
        });

        return {
          ...chat.toObject(),
          unreadCount
        };
      })
    );

    return NextResponse.json(chatDetails);
  } catch (error) {
    console.error('Error fetching my chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}
