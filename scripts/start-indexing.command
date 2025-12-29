#!/bin/bash

echo "Starting Face Indexing System..."

osascript <<EOF
tell application "Terminal"
    -- Terminal 1: Monitor
    do script "cd /Users/khanhtran/ktprod_main/scripts && node local-indexing-monitor.js"
    
    -- Terminal 2: Indexing  
    do script "cd /Users/khanhtran/ktprod_main/scripts && node accurate-indexing.js"
end tell
EOF

echo "Both scripts started in separate terminals"