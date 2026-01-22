#!/bin/bash

echo "🔨 Building TheWild Face Indexing App..."

# Navigate to the face-indexing-app directory
cd "$(dirname "$0")/face-indexing-app"

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Build the app
echo "🏗️  Building Electron app..."
npm run build

# Copy to Applications (use arm64 for Apple Silicon, x64 for Intel)
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    echo "🍎 Detected Apple Silicon, using arm64 build..."
    cp -R "dist/mac-arm64/TheWild Face Indexing.app" "/Applications/"
else
    echo "💻 Detected Intel, using x64 build..."
    cp -R "dist/mac/TheWild Face Indexing.app" "/Applications/"
fi

echo "✅ TheWild Face Indexing app installed to Applications folder!"
echo "🚀 You can now open it from your Applications folder or Spotlight"
