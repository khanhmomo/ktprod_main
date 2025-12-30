#!/bin/bash

echo "🚀 Starting Face Indexing System (Simple Mode)..."
echo "==============================================="

# Set the full path to the project
PROJECT_PATH="/Users/khanhtran/ktprod_main"
INDEXING_SCRIPT="$PROJECT_PATH/scripts/accurate-indexing.js"
MONITOR_SCRIPT="$PROJECT_PATH/scripts/local-indexing-monitor.js"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the scripts exist
if [ ! -f "$INDEXING_SCRIPT" ]; then
    echo "❌ Indexing script not found at: $INDEXING_SCRIPT"
    exit 1
fi

if [ ! -f "$MONITOR_SCRIPT" ]; then
    echo "❌ Monitor script not found at: $MONITOR_SCRIPT"
    exit 1
fi

echo "✅ Environment check passed"
echo "📁 Project path: $PROJECT_PATH"
echo ""

# Change to project directory
cd "$PROJECT_PATH"

echo "🎯 Starting indexing with background monitor..."
echo "💡 Monitor will update every 5 seconds in the background"
echo "🛑 Press Ctrl+C to stop both scripts"
echo ""

# Start monitor in background
node "$MONITOR_SCRIPT" &
MONITOR_PID=$!

# Start indexing in foreground
node "$INDEXING_SCRIPT"

# Clean up monitor when indexing completes
echo ""
echo "🏁 Indexing completed!"
echo "🛑 Stopping background monitor..."
kill $MONITOR_PID 2>/dev/null
echo "✅ All done!"
