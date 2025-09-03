import React, { useState, useEffect, useCallback, memo } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { createLazyWidget } from '../utils/lazyLoading';
import { useStableCallback, withPerformanceProfiler } from '../utils/memoization';
import twilioService from '../services/twilioService';

// 重用已优化的组件
const BalanceDisplay = createLazyWidget(() => import('./Phone/BalanceDisplay'));
const PhoneNumberInput = createLazyWidget(() => import('./Phone/PhoneNumberInput'));
const DialPad = createLazyWidget(() => import('./Phone/DialPad'));
const CallActionButtons = createLazyWidget(() => import('./Phone/CallActionButtons'));
const MicrophonePermissionModal = createLazyWidget(() => import('./MicrophonePermissionModal'));

const DialerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
  max-width: 520px;
  background: rgba(26, 35, 50, 0.8);
  backdrop-filter: blur(20px);
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.75rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    max-width: 380px;
    padding: 1.5rem;
    gap: 1rem;
  }

  @media (max-width: 480px) {
    max-width: 350px;
    padding: 1.25rem;
    gap: 0.9rem;
  }
`;

const CallStatusDisplay = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
  
  ${props => props.$isActive && `
    background: #FFC900;
    animation: pulse 2s infinite;
  `}

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
`;

const CallStatus = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
`;

const CallNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
`;

const CallDuration = styled.div`
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
`;

const LoadingPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

// 默认国家
const DEFAULT_COUNTRY = {
  name: 'United States',
  dialCode: '+1',
  code: 'US',
  flag: '🇺🇸'
};

const OptimizedDialer = memo(({ 
  onCallStart,
  onCallEnd,
  initialNumber = '',
  showBalance = true,
  compact = false 
}) => {
  // 状态管理
  const [phoneNumber, setPhoneNumber] = useState(initialNumber);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [balance, setBalance] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [showMicModal, setShowMicModal] = useState(false);
  const [callStatus, setCallStatus] = useState('');

  const { user } = useAuth();

  // 获取余额
  const fetchBalance = useStableCallback(async () => {
    if (!user || !showBalance) return;
    
    try {
      setIsBalanceLoading(true);
      const response = await fetch('/api/users/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsBalanceLoading(false);
    }
  }, [user, showBalance]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // 通话计时器
  useEffect(() => {
    let interval;
    if (isCallInProgress) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallInProgress]);

  // 事件处理
  const handleNumberPress = useStableCallback((digit) => {
    if (isCallInProgress) {
      // 在通话中发送DTMF音调
      twilioService.sendDTMF?.(digit);
    } else {
      setPhoneNumber(prev => prev + digit);
    }
  }, [isCallInProgress]);

  const handlePhoneNumberChange = useStableCallback((value) => {
    if (!isCallInProgress) {
      setPhoneNumber(value);
    }
  }, [isCallInProgress]);

  const handleCountryChange = useStableCallback((country) => {
    if (!isCallInProgress) {
      setSelectedCountry(country);
    }
  }, [isCallInProgress]);

  const handleDeleteDigit = useStableCallback(() => {
    if (!isCallInProgress) {
      setPhoneNumber(prev => prev.slice(0, -1));
    }
  }, [isCallInProgress]);

  const handleToggleSpeaker = useStableCallback(() => {
    setIsSpeakerOn(prev => {
      const newValue = !prev;
      // 实际切换扬声器
      if (twilioService.toggleSpeaker) {
        twilioService.toggleSpeaker(newValue);
      }
      return newValue;
    });
  }, []);

  const handleStartCall = useStableCallback(async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    if (!user) {
      toast.error('Please login to make calls');
      return;
    }

    if (balance < 0.01) {
      toast.error('Insufficient balance. Please top up your account.');
      return;
    }

    try {
      setCallStatus('Connecting...');
      setIsCallInProgress(true);
      
      // 检查麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      // 启动通话
      const fullNumber = selectedCountry.dialCode + phoneNumber.replace(/^\+/, '');
      await twilioService.makeCall(fullNumber);
      
      setCallStatus('Connected');
      onCallStart?.(fullNumber);
      
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        setShowMicModal(true);
      } else {
        toast.error('Failed to start call: ' + error.message);
      }
      setIsCallInProgress(false);
      setCallStatus('');
    }
  }, [phoneNumber, user, balance, selectedCountry, onCallStart]);

  const handleEndCall = useStableCallback(async () => {
    try {
      await twilioService.endCall();
      setIsCallInProgress(false);
      setCallStatus('');
      setCallDuration(0);
      onCallEnd?.();
      toast.success('Call ended');
    } catch (error) {
      toast.error('Failed to end call: ' + error.message);
    }
  }, [onCallEnd]);

  const handleAddContact = useStableCallback((number) => {
    toast.info('Add contact feature coming soon!');
  }, []);

  const handleMicModalClose = useStableCallback(() => {
    setShowMicModal(false);
    setIsCallInProgress(false);
    setCallStatus('');
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DialerContainer>
      {/* 余额显示 */}
      {showBalance && (
        <React.Suspense fallback={<LoadingPlaceholder>Loading balance...</LoadingPlaceholder>}>
          <BalanceDisplay 
            balance={balance} 
            isLoading={isBalanceLoading} 
          />
        </React.Suspense>
      )}

      {/* 通话状态显示 */}
      {isCallInProgress && (
        <CallStatusDisplay $isActive={isCallInProgress}>
          <CallStatus>{callStatus}</CallStatus>
          <CallNumber>{selectedCountry.dialCode}{phoneNumber}</CallNumber>
          <CallDuration>{formatDuration(callDuration)}</CallDuration>
        </CallStatusDisplay>
      )}

      {/* 电话号码输入 */}
      {!compact && (
        <React.Suspense fallback={<LoadingPlaceholder>Loading input...</LoadingPlaceholder>}>
          <PhoneNumberInput
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            selectedCountry={selectedCountry}
            onCountryChange={handleCountryChange}
            onAddContact={handleAddContact}
            isLoggedIn={!!user}
            placeholder={isCallInProgress ? "Enter DTMF tones" : "Enter phone number"}
          />
        </React.Suspense>
      )}

      {/* 拨号键盘 */}
      <React.Suspense fallback={<LoadingPlaceholder>Loading dial pad...</LoadingPlaceholder>}>
        <DialPad
          onNumberPress={handleNumberPress}
          disabled={false}
        />
      </React.Suspense>

      {/* 操作按钮 */}
      <React.Suspense fallback={<LoadingPlaceholder>Loading buttons...</LoadingPlaceholder>}>
        <CallActionButtons
          phoneNumber={phoneNumber}
          onCall={isCallInProgress ? handleEndCall : handleStartCall}
          onDelete={handleDeleteDigit}
          onToggleSpeaker={handleToggleSpeaker}
          isSpeakerOn={isSpeakerOn}
          isCallInProgress={isCallInProgress}
          isCallDisabled={!user || (balance < 0.01 && !isCallInProgress)}
          callButtonText={isCallInProgress ? "End Call" : "Call"}
        />
      </React.Suspense>

      {/* 麦克风权限模态框 */}
      {showMicModal && (
        <React.Suspense fallback={null}>
          <MicrophonePermissionModal onClose={handleMicModalClose} />
        </React.Suspense>
      )}
    </DialerContainer>
  );
});

OptimizedDialer.displayName = 'OptimizedDialer';

export default withPerformanceProfiler(OptimizedDialer, 'OptimizedDialer');
