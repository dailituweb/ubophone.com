#!/bin/bash

# Build script for Ubophone Platform
set -e

echo "🚀 Starting build process..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install --legacy-peer-deps

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install --legacy-peer-deps

# Build client
echo "🔨 Building client..."
npm run build

# Return to root directory
cd ..

echo "✅ Build completed successfully!"
echo "📁 Built files are in client/build/"

# Verify build output
if [ -f "client/build/index.html" ]; then
    echo "✅ index.html found in build directory"
else
    echo "❌ index.html not found in build directory"
    exit 1
fi

echo "🎉 Build process finished!" 