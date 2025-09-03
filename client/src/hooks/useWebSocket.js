import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found, skipping WebSocket connection');
      return;
    }

    console.log('🔌 Initializing WebSocket connection...');
    
    // 创建 Socket.IO 连接
    const socket = io(process.env.NODE_ENV === 'production' ? 'https://ubophone.com' : 'http://localhost:5001', {
      auth: {
        token: token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    });

    socketRef.current = socket;

    // 连接事件
    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      setIsConnected(true);
    });

    socket.on('connected', (data) => {
      console.log('📡 WebSocket connection confirmed:', data);
      setLastMessage({
        type: 'connected',
        data: data,
        timestamp: new Date().toISOString()
      });
    });

    // 断开连接事件
    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    // 连接错误事件
    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    // 监听新通话记录
    socket.on('new_call_record', (data) => {
      console.log('📞 New call record received via WebSocket:', data);
      setLastMessage({
        type: 'new_call_record',
        data: data,
        timestamp: new Date().toISOString()
      });

      // 使用延迟和批量处理避免并发冲突
      setTimeout(() => {
        console.log('🔄 Invalidating queries after WebSocket notification');
        queryClient.invalidateQueries({ queryKey: ['callHistory'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }, 100); // 100ms延迟确保数据库操作完成
    });

    // 监听统计数据更新
    socket.on('dashboard_update', (data) => {
      console.log('📊 Dashboard update received via WebSocket:', data);
      setLastMessage({
        type: 'dashboard_update',
        data: data,
        timestamp: new Date().toISOString()
      });

      // 使用延迟避免并发冲突
      setTimeout(() => {
        console.log('🔄 Invalidating dashboard queries after WebSocket notification');
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }, 50);
    });

    // 监听通话状态变化
    socket.on('call_status_change', (data) => {
      console.log('📞 Call status change via WebSocket:', data);
      setLastMessage({
        type: 'call_status_change',
        data: data,
        timestamp: new Date().toISOString()
      });

      // 使用延迟和批量处理避免并发冲突
      setTimeout(() => {
        console.log('🔄 Invalidating queries after call status change');
        queryClient.invalidateQueries({ queryKey: ['callHistory'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }, 150);
    });

    // 🔔 监听来电事件
    socket.on('incoming_call', (data) => {
      console.log('📞 Incoming call received via WebSocket:', data);
      setLastMessage({
        type: 'incoming_call',
        data: data,
        timestamp: new Date().toISOString()
      });

      // 刷新来电历史数据
      queryClient.invalidateQueries(['incomingCallHistory']);
      queryClient.invalidateQueries(['dashboard']);
    });

    // 🔧 监听来电取消事件
    socket.on('incoming_call_canceled', (data) => {
      console.log('📞 Incoming call canceled via WebSocket:', data);
      setLastMessage({
        type: 'incoming_call_canceled',
        data: data,
        timestamp: new Date().toISOString()
      });

      // 刷新来电历史数据
      queryClient.invalidateQueries(['incomingCallHistory']);
      queryClient.invalidateQueries(['dashboard']);
    });

    // 🔧 监听来电结束事件（对方挂断）
    socket.on('incoming_call_ended', (data) => {
      console.log('📞 Incoming call ended via WebSocket (caller hung up):', data);
      setLastMessage({
        type: 'incoming_call_ended',
        data: data,
        timestamp: new Date().toISOString()
      });

      // 刷新来电历史数据
      queryClient.invalidateQueries(['incomingCallHistory']);
      queryClient.invalidateQueries(['dashboard']);
    });

    // 心跳检测
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000); // 每30秒发送一次心跳

    socket.on('pong', (data) => {
      console.log('💓 WebSocket heartbeat response:', data);
    });

    // 清理函数
    return () => {
      console.log('🔌 Cleaning up WebSocket connection...');
      clearInterval(heartbeatInterval);
      socket.off('connect');
      socket.off('connected');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('new_call_record');
      socket.off('dashboard_update');
      socket.off('call_status_change');
      socket.off('incoming_call_ended');
      socket.off('pong');
      socket.disconnect();
    };
  }, [queryClient]);

  // 发送消息的方法
  const sendMessage = (event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log(`📤 Sending WebSocket message: ${event}`, data);
      socketRef.current.emit(event, data);
      return true;
    } else {
      console.log('❌ WebSocket not connected, cannot send message');
      return false;
    }
  };

  // 请求桌面通知权限
  const requestNotificationPermission = () => {
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
    requestNotificationPermission
  };
};