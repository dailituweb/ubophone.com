#!/bin/bash

echo "🚀 Starting VoiceCall Platform with PostgreSQL"
echo "=============================================="

# 检查依赖
echo "📦 Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

# 启动后端服务器
echo "🔧 Starting backend server (port 5000)..."
cd server
NODE_ENV=development node index.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:5000/ > /dev/null; then
    echo "✅ Backend server started successfully"
else
    echo "⚠️ Backend server may need a moment to start"
fi

# 启动前端服务器
echo "🌐 Starting frontend server (port 3001)..."
cd ../client
PORT=3001 npm start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "🎉 VoiceCall Platform is starting!"
echo "=================================="
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:5000"
echo "🗄️ Database: Neon PostgreSQL (connected)"
echo ""
echo "📊 Features Available:"
echo "- 👤 User Authentication"
echo "- 📞 International Calling" 
echo "- 💳 Payment System"
echo "- 📈 Call Analytics"
echo "- 🎙️ Call Recordings"
echo "- 📱 Incoming Call Settings"
echo ""
echo "Press Ctrl+C to stop all services"

# 等待用户中断
wait 