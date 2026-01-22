#!/bin/bash

echo "🚀 Starting Face Indexing..."
echo "============================"

# Set the full path to the project
PROJECT_PATH="/Users/khanhtran/ktprod_main"
INDEXING_SCRIPT="$PROJECT_PATH/scripts/accurate-indexing.js"

# Change to project directory and start indexing
cd "$PROJECT_PATH"
echo "🎯 Starting accurate face indexing with smart resume..."
echo ""

node "$INDEXING_SCRIPT"

echo ""
echo "🏁 Indexing completed!"
