import { NextApiRequest, NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { initializeSocket } from '../../../../lib/socket-server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponse & { socket: any }
) {
  console.log('🔌 Socket handler called:', req.method, req.url);
  
  if (res.socket.server.io) {
    console.log('✅ Socket is already running');
  } else {
    console.log('🔧 Initializing Socket.IO server...');
    const httpServer: NetServer = res.socket.server as any;
    const io = initializeSocket(httpServer);
    res.socket.server.io = io;
  }
  res.end();
}
