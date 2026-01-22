import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import KindWord from '@/models/KindWord';

export async function GET() {
  try {
    await connectDB();
    
    const kindWords = await KindWord.find().sort({ createdAt: -1 });
    
    console.log('API returning kind words:', kindWords); // Debug log
    return NextResponse.json(kindWords);
  } catch (error) {
    console.error('Error fetching kind words:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kind words' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('POST request body:', body);
    const { text, customerName, imageUrl, imageAlt } = body;
    
    console.log('Extracted POST data:', { text, customerName, imageUrl, imageAlt });
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }
    
    const kindWord = await KindWord.create({
      text,
      customerName: customerName || 'Happy Client',
      imageUrl: imageUrl || '',
      imageAlt: imageAlt || '',
    });
    
    // Force the customerName field to be saved
    await KindWord.updateOne(
      { _id: kindWord._id },
      { $set: { customerName: customerName || 'Happy Client' } },
      { strict: false }
    );
    
    // Fetch the updated document
    const updatedKindWord = await KindWord.findById(kindWord._id);
    console.log('Updated kind word:', updatedKindWord);
    
    return NextResponse.json(updatedKindWord, { status: 201 });
  } catch (error) {
    console.error('Error creating kind word:', error);
    return NextResponse.json(
      { error: 'Failed to create kind word' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('PUT request body:', body);
    const { id, text, customerName, imageUrl, imageAlt } = body;
    
    console.log('Extracted data:', { id, text, customerName, imageUrl, imageAlt });
    
    if (!id || !text) {
      console.log('Missing required fields:', { id, text });
      return NextResponse.json(
        { error: 'ID and text are required' },
        { status: 400 }
      );
    }
    
    // Convert string ID to ObjectId
    const { ObjectId } = require('mongodb');
    const objectId = new ObjectId(id);
    console.log('Converted to ObjectId:', objectId);
    
    const updateData = { 
      text, 
      customerName: customerName || 'Happy Client', 
      imageUrl, 
      imageAlt 
    };
    console.log('Updating with data:', updateData);

    // Use Mongoose but with a different approach - try to update the document directly
    const result = await KindWord.updateOne(
      { _id: objectId },
      { $set: updateData },
      { strict: false }
    );
    console.log('UpdateOne with strict: false result:', result);

    // Fetch the updated document
    const kindWord = await KindWord.findById(objectId).lean();
    console.log('Final document (lean):', kindWord);
    
    if (!kindWord) {
      return NextResponse.json(
        { error: 'Kind word not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(kindWord);
  } catch (error) {
    console.error('Error updating kind word:', error);
    return NextResponse.json(
      { error: 'Failed to update kind word' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const kindWord = await KindWord.findByIdAndDelete(id);
    
    if (!kindWord) {
      return NextResponse.json(
        { error: 'Kind word not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Kind word deleted successfully' });
  } catch (error) {
    console.error('Error deleting kind word:', error);
    return NextResponse.json(
      { error: 'Failed to delete kind word' },
      { status: 500 }
    );
  }
}
