import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Inquiry from '@/models/Inquiry';

// GET /api/admin/inquiries - Fetch all inquiries with filtering
export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'all', 'unread', 'read', 'replied'
    const search = searchParams.get('search'); // search term
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
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
        replied: await Inquiry.countDocuments({ status: 'replied' })
      }
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
