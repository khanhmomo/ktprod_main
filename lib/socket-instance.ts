import { Server as ServerIO } from 'socket.io';

class SocketManager {
  private io: ServerIO | null = null;

  setInstance(io: ServerIO) {
    this.io = io;
    console.log('✅ Socket.IO instance stored in SocketManager');
  }

  getInstance(): ServerIO | null {
    if (!this.io) {
      console.log('❌ Socket.IO instance not found in SocketManager');
      return null;
    }
    return this.io;
  }

  emitToAdmins(event: string, data: any) {
    const io = this.getInstance();
    if (io) {
      console.log(`📡 Emitting ${event} to admin room:`, data);
      io.to('admin-room').emit(event, data);
      console.log(`✅ Successfully emitted ${event}`);
    } else {
      console.log(`❌ Cannot emit ${event} - Socket.IO not available`);
    }
  }
}

// Export a singleton instance
export const socketManager = new SocketManager();
