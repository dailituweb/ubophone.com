import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import webSocketService from '../services/websocketService';
import { useAuth } from '../context/AuthContext';

function IncomingCallManager() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Set up WebSocket event listeners
    const handleIncomingCall = (callData) => {
      console.log('📞 IncomingCallManager: Received incoming call', callData);
      
      // 🔄 智能路由逻辑：根据当前页面决定处理方式
      const currentPath = location.pathname;
      
      if (currentPath === '/phone') {
        // 如果用户已经在拨号页面，直接触发页面的来电模式（通过WebSocket事件）
        console.log('📞 User is on phone page - triggering direct mode');
        // 不设置本地状态，让PhonePage组件自己处理
        return;
      } else {
        // 如果用户在其他页面，跳转到拨号页面并传递来电数据
        console.log('📞 User is on other page - navigating to phone page');
        
        // 先存储当前页面路径（返回用）
        const returnPath = currentPath;
        
        // 跳转到拨号页面，通过URL参数传递来电数据
        const callDataEncoded = encodeURIComponent(JSON.stringify(callData));
        navigate(`/phone?incoming=true&callData=${callDataEncoded}&returnTo=${encodeURIComponent(returnPath)}`);
      }
      
      // 显示简短的toast通知
      toast.info(`📞 Incoming call from ${callData.fromNumber}`, {
        autoClose: 3000,
        toastId: `incoming_call_${callData.callSid}`
      });
    };

    const handleCallTimeout = (callData) => {
      console.log('⏰ IncomingCallManager: Call timeout', callData);
      toast.dismiss(`incoming_call_${callData.callSid}`);
      toast.info('Call timed out - sent to voicemail');
    };

    const handleCallStatusChange = (statusData) => {
      console.log('📞 IncomingCallManager: Call status change', statusData);
      
      if (statusData.status === 'ended' || statusData.status === 'completed') {
        toast.dismiss(`incoming_call_${statusData.callSid}`);
      }
    };

    const handleNewVoicemail = (voicemailData) => {
      console.log('📧 IncomingCallManager: New voicemail', voicemailData);
      // The service already shows a toast, so we just need to update our state
    };

    const handleConnected = () => {
      console.log('✅ IncomingCallManager: WebSocket connected');
    };

    const handleDisconnected = (data) => {
      console.log('❌ IncomingCallManager: WebSocket disconnected', data);
    };

    const handleAuthError = (error) => {
      console.error('❌ IncomingCallManager: WebSocket auth error', error);
      toast.error('Connection error. Please login again.');
    };

    // Add event listeners
    webSocketService.on('incoming_call', handleIncomingCall);
    webSocketService.on('incoming_call_timeout', handleCallTimeout);
    webSocketService.on('call_status_change', handleCallStatusChange);
    webSocketService.on('new_voicemail', handleNewVoicemail);
    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('auth_error', handleAuthError);

    // Cleanup
    return () => {
      webSocketService.off('incoming_call', handleIncomingCall);
      webSocketService.off('incoming_call_timeout', handleCallTimeout);
      webSocketService.off('call_status_change', handleCallStatusChange);
      webSocketService.off('new_voicemail', handleNewVoicemail);
      webSocketService.off('connected', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('auth_error', handleAuthError);
    };
  }, [user, location, navigate]);

  // Test function for development
  const simulateIncomingCall = () => {
    if (process.env.NODE_ENV === 'development') {
      const testCallData = {
        callId: 'test-call-' + Date.now(),
        callSid: 'CA-test-' + Date.now(),
        fromNumber: '+1234567890',
        toNumber: '+1987654321',
        callerIdName: 'Test Caller',
        phoneNumberId: 'test-phone-id',
        startTime: new Date().toISOString(),
        timeout: 30000
      };
      
      // Directly trigger the WebSocket handler instead
      webSocketService.handleIncomingCall(testCallData);
    }
  };

  // Expose test function globally in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.simulateIncomingCall = simulateIncomingCall;
      console.log('🧪 Development mode: Use window.simulateIncomingCall() to test incoming calls');
    }
  }, []);

  // 不再渲染弹窗，通过智能路由处理来电
  return null;
}

export default IncomingCallManager;