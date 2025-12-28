import { NextResponse } from 'next/server';
import { ChatMessage } from '@/models/Chat';
import dbConnect from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { message, senderType, senderId, senderName } = await request.json();

    if (!message || !senderType || !senderId || !senderName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const chatMessage = new ChatMessage({
      chatId: params.id,
      senderType,
      senderId,
      senderName,
      message
    });

    await chatMessage.save();

    // Update chat's last message
    const Chat = (await import('@/models/Chat')).Chat;
    await Chat.findByIdAndUpdate(params.id, {
      lastMessage: message,
      lastMessageTime: new Date()
    });

    return NextResponse.json(chatMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
