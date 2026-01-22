import { Server as ServerIO } from 'socket.io';

export const getSocketIO = () => {
  console.log('🔍 Checking global.io availability...');
  console.log('🔍 Global keys:', Object.keys(global));
  console.log('🔍 Global.io type:', typeof (global as any).io);
  console.log('🔍 Global.io value:', (global as any).io);
  
  const io = (global as any).io;
  if (!io) {
    console.log('❌ Socket.IO not available in global scope');
    console.log('❌ Available globals:', Object.keys(global));
    return null;
  }
  console.log('✅ Socket.IO found in global scope');
  return io as ServerIO;
};

export const emitToAdmins = (event: string, data: any) => {
  console.log(`🔍 Attempting to emit ${event}...`);
  const io = getSocketIO();
  if (io) {
    console.log(`📡 Emitting ${event} to admin room:`, data);
    io.to('admin-room').emit(event, data);
    console.log(`✅ Successfully emitted ${event}`);
  } else {
    console.log(`❌ Cannot emit ${event} - Socket.IO not available`);
  }
};
