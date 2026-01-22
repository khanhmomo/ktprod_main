// Use a simple global approach
let globalSocketIO = null;

const setSocketInstance = (io) => {
  console.log('🔧 setSocketInstance called with:', !!io);
  globalSocketIO = io;
  // Also store in process global for cross-module access
  process.globalSocketIO = io;
  console.log('✅ Socket.IO instance stored globally');
  console.log('🔍 globalSocketIO after set:', !!globalSocketIO);
  console.log('🔍 process.globalSocketIO after set:', !!process.globalSocketIO);
};

const getSocketInstance = () => {
  console.log('🔍 getSocketInstance called');
  console.log('🔍 globalSocketIO value:', !!globalSocketIO);
  console.log('🔍 process.globalSocketIO value:', !!process.globalSocketIO);
  
  // Try both global variables
  const io = globalSocketIO || process.globalSocketIO;
  if (!io) {
    console.log('❌ Socket.IO instance not found in any global');
    return null;
  }
  console.log('✅ Socket.IO instance found in global');
  return io;
};

const emitToAdmins = (event, data) => {
  console.log(`🔍 Attempting to emit ${event} via global`);
  const io = getSocketInstance();
  if (io) {
    console.log(`📡 Emitting ${event} to admin room:`, data);
    io.to('admin-room').emit(event, data);
    console.log(`✅ Successfully emitted ${event}`);
  } else {
    console.log(`❌ Cannot emit ${event} - Socket.IO not available`);
  }
};

module.exports = { setSocketInstance, getSocketInstance, emitToAdmins };
