#!/bin/bash

echo "🔍 Starting Face Indexing Monitor..."
echo "===================================="

# Set the full path to the project
PROJECT_PATH="/Users/khanhtran/ktprod_main"
MONITOR_SCRIPT="$PROJECT_PATH/scripts/local-indexing-monitor.js"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the monitor script exists
if [ ! -f "$MONITOR_SCRIPT" ]; then
    echo "❌ Monitor script not found at: $MONITOR_SCRIPT"
    exit 1
fi

echo "✅ Environment check passed"
echo "📁 Project path: $PROJECT_PATH"
echo ""

# Change to project directory and start monitor
cd "$PROJECT_PATH"
echo "🔍 Starting real-time indexing monitor..."
echo "📊 Updates every 5 seconds"
echo "🛑 Press Ctrl+C to stop monitoring"
echo ""

node scripts/local-indexing-monitor.js
