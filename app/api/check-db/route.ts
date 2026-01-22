import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/connect';

export async function GET() {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Get sample data from each collection
    const collectionsData: Record<string, any> = {};
    
    for (const collectionName of collectionNames) {
      try {
        const docs = await db.collection(collectionName).find({}).limit(2).toArray();
        collectionsData[collectionName] = {
          count: await db.collection(collectionName).countDocuments(),
          sample: docs.map(doc => ({
            _id: doc._id,
            ...(collectionName === 'albums' ? {
              title: doc.title,
              imageCount: doc.images?.length || 0,
              firstImageUrl: doc.images?.[0]?.url || 'No image URL',
              firstImageType: doc.images?.[0]?.url ? typeof doc.images[0].url : 'N/A'
            } : {})
          }))
        };
      } catch (err) {
        console.error(`Error fetching data from ${collectionName}:`, err);
        collectionsData[collectionName] = { error: 'Error fetching data' };
      }
    }
    
    return NextResponse.json({
      status: 'success',
      dbName: db.databaseName,
      collections: collectionNames,
      collectionsData
    });
    
  } catch (error) {
    console.error('Database check failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      { status: 500 }
    );
  }
}
