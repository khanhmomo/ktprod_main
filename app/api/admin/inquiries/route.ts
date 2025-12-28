import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server-auth';
import dbConnect from '@/lib/db';
import Inquiry from '@/models/Inquiry';

// Generate unique case ID
function generateCaseId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `INQ-${timestamp.toUpperCase()}-${random.toUpperCase()}`;
}

// POST /api/admin/inquiries - Create new inquiry
export async function POST(request: Request) {
  try {
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401, headers }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { name, email, subject, message, source, phone, chatLog } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { message: 'Name, email, and message are required' },
        { status: 400, headers }
      );
    }

    // Create inquiry with optional chat log
    const inquiryData: any = {
      caseId: generateCaseId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      subject: subject?.trim() || 'Customer Inquiry',
      source: source || 'email'
    };

    // Add phone if provided
    if (phone && phone.trim()) {
      inquiryData.message = `${inquiryData.message}\n\nPhone: ${phone.trim()}`;
    }

    // Add chat log to message if provided
    if (chatLog && Array.isArray(chatLog)) {
      const formattedChatLog = chatLog
        .map((msg: any) => {
          const time = new Date(msg.timestamp).toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            month: 'short',
            day: 'numeric'
          });
          return `[${time}] ${msg.senderName}: ${msg.message}`;
        })
        .join('\n');

      inquiryData.message = `${message}\n\n--- Chat Transcript ---\n${formattedChatLog}`;
    }

    const inquiry = new Inquiry(inquiryData);
    await inquiry.save();

    return NextResponse.json(inquiry, { headers });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500, headers }
    );
  }
}

// GET /api/admin/inquiries - Fetch all inquiries with filtering
export async function GET(request: Request) {
  try {
    // Add caching headers to prevent browser caching issues
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401, headers }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'all', 'unread', 'read', 'replied'
    const source = searchParams.get('source'); // 'all', 'email', 'live_chat'
    const search = searchParams.get('search'); // search term
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (source && source !== 'all') {
      if (source === 'email') {
        query.$or = [
          { source: 'email' },
          { source: { $exists: false } },
          { source: null }
        ];
      } else {
        query.source = source;
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { caseId: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort by status (unread first) and then by creation date (newest first)
    const sortOrder: { [key: string]: 'asc' | 'desc' } = {
      status: 'asc', // unread (0), read (1), replied (2) - ascending puts unread first
      priority: 'desc', // high (2), medium (1), low (0) - descending puts high first
      createdAt: 'desc' // newest first
    };

    const skip = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      Inquiry.find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments(query)
    ]);

    return NextResponse.json({
      inquiries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: {
        total,
        unread: await Inquiry.countDocuments({ status: 'unread' }),
        read: await Inquiry.countDocuments({ status: 'read' }),
        replied: await Inquiry.countDocuments({ status: 'replied' }),
        email: await Inquiry.countDocuments({ 
          $or: [
            { source: 'email' },
            { source: { $exists: false } },
            { source: null }
          ]
        }),
        live_chat: await Inquiry.countDocuments({ source: 'live_chat' })
      }
    }, { headers });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    
    // Add caching headers to error responses as well
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500, headers }
    );
  }
}
