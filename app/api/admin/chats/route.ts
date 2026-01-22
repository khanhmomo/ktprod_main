import { NextResponse } from 'next/server';
import { Chat, ChatMessage } from '@/models/Chat';
import dbConnect from '@/lib/db';
import { isAuthenticated } from '@/lib/server-auth';

export async function GET() {
  try {
    await dbConnect();
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chats = await Chat.find()
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
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { customerName, customerEmail, customerPhone, message } = await request.json();

    if (!customerName || !customerEmail || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create new chat
    const chat = new Chat({
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      lastMessage: message,
      lastMessageTime: new Date()
    });

    await chat.save();

    // Create initial message
    const chatMessage = new ChatMessage({
      chatId: chat._id,
      senderType: 'customer',
      senderId: customerEmail,
      senderName: customerName,
      message
    });

    await chatMessage.save();

    return NextResponse.json({
      chat: chat.populate('assignedTo assignedBy'),
      message: chatMessage
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
