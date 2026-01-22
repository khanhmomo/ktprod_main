import { NextResponse } from 'next/server';
import { Chat, ChatMessage } from '@/models/Chat';
import dbConnect from '@/lib/db';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { customerName, customerEmail, customerPhone, message } = await request.json();

    if (!customerName || !customerEmail || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if there's an existing active chat for this customer
    const existingChat = await Chat.findOne({
      customerEmail,
      status: { $in: ['active', 'assigned'] }
    });

    let chat;
    if (existingChat) {
      chat = existingChat;
      chat.lastMessage = message;
      chat.lastMessageTime = new Date();
      await chat.save();
    } else {
      // Create new chat
      chat = new Chat({
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        lastMessage: message,
        lastMessageTime: new Date()
      });
      await chat.save();
    }

    // Create message
    const chatMessage = new ChatMessage({
      chatId: chat._id,
      senderType: 'customer',
      senderId: customerEmail,
      senderName: customerName,
      message
    });

    await chatMessage.save();

    return NextResponse.json({
      chatId: chat._id,
      message: chatMessage
    });
  } catch (error) {
    console.error('Error sending customer message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    const messages = await ChatMessage.find({ chatId })
      .sort({ timestamp: 1 });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
