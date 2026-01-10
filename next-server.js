const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { setSocketInstance } = require('./lib/socket-instance');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Create HTTP server
const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Error occurred handling', req.url, err);
    res.statusCode = 500;
    res.end('internal server error');
  }
}).on('upgrade', (req, socket, head) => {
  console.log('🔌 WebSocket upgrade request:', req.url);
  // Let Socket.IO handle WebSocket upgrades
  if (req.url === '/api/socket/io') {
    console.log('🔌 Allowing Socket.IO WebSocket upgrade');
  }
});

// Initialize Socket.IO
const io = new Server(server, {
  path: '/api/socket/io',
  addTrailingSlash: false,
  transports: ['websocket'], // Use only WebSocket, no polling
  allowEIO3: true,
  cors: {
    origin: dev ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : process.env.NEXTAUTH_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 60000 // Reduce ping frequency from 25s to 60s
});

// Store io in global scope and socket instance
global.io = io;
console.log('🔧 About to call setSocketInstance...');
setSocketInstance(io);

console.log('✅ Socket.IO server initialized and stored globally');
console.log('🔍 Global.io available:', !!global.io);
console.log('🔍 process.globalSocketIO available:', !!process.globalSocketIO);

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // Join admin room for authenticated users
  socket.on('join-admin', (data) => {
    console.log('👤 Admin joining admin room:', socket.id, data);
    socket.join('admin-room');
    console.log('✅ Admin joined admin room:', socket.id);
    socket.emit('joined-admin', { success: true, message: 'Successfully joined admin room' });
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });

  // Test event
  socket.on('ping', () => {
    console.log('🏓 Ping received from:', socket.id);
    socket.emit('pong', { timestamp: Date.now() });
  });

  // Debug: Log all events
  socket.onAny((eventName, ...args) => {
    console.log(`📡 Event received: ${eventName}`, args);
  });
});

// Start the server
app.prepare().then(() => {
  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('🔍 Final check - Global.io available:', !!global.io);
  });
});
