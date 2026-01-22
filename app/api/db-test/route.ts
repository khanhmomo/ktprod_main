import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/connect';

export async function GET() {
  try {
    console.log('Connecting to MongoDB...');
    await dbConnect();
    
    // List all databases
    const adminDb = mongoose.connection.db.admin();
    const dbs = await adminDb.listDatabases();
    
    console.log('Available databases:', dbs.databases.map((db: any) => db.name));
    
    // Check if our database exists
    const dbName = process.env.MONGODB_URI?.split('/').pop()?.split('?')[0];
    const dbExists = dbs.databases.some((db: any) => db.name === dbName);
    
    return NextResponse.json({
      status: 'success',
      connected: true,
      dbName,
      dbExists,
      availableDatabases: dbs.databases.map((db: any) => ({
        name: db.name,
        sizeOnDisk: db.sizeOnDisk,
        empty: db.empty
      })),
      connectionState: mongoose.connection.readyState,
      connectionHost: mongoose.connection.host,
      connectionDb: mongoose.connection.name
    });
    
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      connected: false,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : 'Unknown error',
      connectionState: mongoose.connection?.readyState,
      connectionHost: mongoose.connection?.host,
      connectionDb: mongoose.connection?.name,
      env: {
        nodeEnv: process.env.NODE_ENV,
        mongoUri: process.env.MONGODB_URI ? '***' : 'Not set'
      }
    }, { status: 500 });
  }
}
