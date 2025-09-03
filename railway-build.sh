#!/bin/bash

# Railway Build Script for Ubophone Platform
set -e

echo "🚀 Starting Railway build process..."
echo "📍 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install --legacy-peer-deps

# Check if client directory exists
if [ ! -d "client" ]; then
    echo "❌ Error: client directory not found"
    exit 1
fi

# Navigate to client directory
echo "📂 Navigating to client directory..."
cd client

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: client/package.json not found"
    exit 1
fi

# Check if public/index.html exists
if [ ! -f "public/index.html" ]; then
    echo "❌ Error: client/public/index.html not found"
    echo "📁 Contents of public directory:"
    ls -la public/ || echo "public directory does not exist"
    exit 1
fi

echo "✅ Found client/public/index.html"

# Install client dependencies
echo "📦 Installing client dependencies..."
npm install --legacy-peer-deps

# Build client
echo "🔨 Building client application..."
npm run build

# Verify build output
if [ ! -d "build" ]; then
    echo "❌ Error: build directory was not created"
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    echo "❌ Error: build/index.html was not created"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Build directory contents:"
ls -la build/

# Return to root directory
cd ..

echo "🎉 Railway build process finished!"
echo "📍 Final directory: $(pwd)" 