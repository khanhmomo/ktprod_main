import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponse & { socket: any }) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL || 'https://thewildstudio.com'
          : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Store io instance globally for access from other API routes
    (res.socket.server as any).io = io;
    (global as any).io = io;

    // Handle connections
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join admin room for authenticated users
      socket.on('join-admin', (data) => {
        // In a real app, you'd verify authentication here
        socket.join('admin-room');
        console.log('Admin joined admin room:', socket.id);
      });

      // Handle disconnections
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default SocketHandler;

// Helper function to emit events from other API routes
export const emitToAdmins = (event: string, data: any) => {
  const io = (global as any).io;
  if (io) {
    io.to('admin-room').emit(event, data);
    console.log(`Emitted ${event} to admin room:`, data);
  } else {
    console.log('Socket.io not initialized');
  }
};
