import mongoose, { ConnectOptions, Mongoose } from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const MONGODB_URI: string = process.env.MONGODB_URI;

interface CachedMongoose {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: CachedMongoose;
}

// Initialize the cached connection object
global.mongoose = global.mongoose || { conn: null, promise: null };
const cached = global.mongoose;

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

// Connection events
mongoose.connection.on('connecting', () => {
  console.log('MongoDB: Connecting...');
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB: Connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB: Disconnected');
});

export async function dbConnect(): Promise<Mongoose> {
  // Check if we have a cached connection in development
  if (process.env.NODE_ENV === 'development' && cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }

  // In production, check if we have a valid connection
  if (process.env.NODE_ENV === 'production' && cached.conn) {
    try {
      // Check if the connection is still alive
      if (cached.conn.connection?.db) {
        await cached.conn.connection.db.admin().ping();
        console.log('Using existing database connection');
        return cached.conn;
      }
    } catch (error) {
      console.log('Database connection lost, reconnecting...');
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };

    console.log('Creating new database connection...');
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Database connected successfully');
        return mongoose;
      })
      .catch((error) => {
        console.error('Database connection failed:', error);
        cached.promise = null; // Reset the promise to allow retries
        throw error;
      });
  }

  if (!cached.promise) {
    throw new Error('Failed to establish database connection');
  }

  try {
    cached.conn = await cached.promise;
    if (!cached.conn) {
      throw new Error('Failed to establish database connection');
    }
    return cached.conn;
  } catch (err) {
    console.error('Error creating MongoDB connection:', err);
    cached.promise = null;
    throw err;
  }
}

export default dbConnect;
