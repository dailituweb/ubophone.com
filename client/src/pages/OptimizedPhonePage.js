import React, { useState, useEffect, useCallback, memo } from 'react';
import styled from 'styled-components';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { createLazyWidget } from '../utils/lazyLoading';
import { useStableCallback, withPerformanceProfiler } from '../utils/memoization';

// 懒加载组件
const TutorialCard = createLazyWidget(() => import('../components/Phone/TutorialCard'));
const DialerContainer = createLazyWidget(() => import('../components/Phone/DialerContainer'));
const BalanceDisplay = createLazyWidget(() => import('../components/Phone/BalanceDisplay'));
const PhoneNumberInput = createLazyWidget(() => import('../components/Phone/PhoneNumberInput'));
const DialPad = createLazyWidget(() => import('../components/Phone/DialPad'));
const CallActionButtons = createLazyWidget(() => import('../components/Phone/CallActionButtons'));

// 延迟加载重型组件
const MicrophonePermissionModal = createLazyWidget(() => import('../components/MicrophonePermissionModal'));

const PhonePageContainer = styled.div`
  min-height: 100vh;
  padding: 1.5rem;
  background: #FAFAFA;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem calc(80px + env(safe-area-inset-bottom)) 0.5rem;
    min-height: calc(100vh - 60px);
  }
`;

const PageContent = styled.div`
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const LoadingPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  color: #666;
  font-size: 0.9rem;
`;

// 默认国家选项
const DEFAULT_COUNTRY = {
  name: 'United States',
  dialCode: '+1',
  code: 'US',
  flag: '🇺🇸'
};

const OptimizedPhonePage = memo(() => {
  // 状态管理
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [showMicModal, setShowMicModal] = useState(false);
  const [balance, setBalance] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);

  // Hooks
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // 从URL参数获取电话号码
  useEffect(() => {
    const numberFromUrl = searchParams.get('number');
    if (numberFromUrl) {
      setPhoneNumber(numberFromUrl);
    }
  }, [searchParams]);

  // 获取用户余额
  const fetchBalance = useStableCallback(async () => {
    if (!user) return;
    
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
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // 检查是否显示教程
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('phone-tutorial-seen');
    if (!hasSeenTutorial && user) {
      setShowTutorial(true);
    }
  }, [user]);

  // 事件处理函数
  const handleNumberPress = useStableCallback((digit) => {
    setPhoneNumber(prev => prev + digit);
  }, []);

  const handlePhoneNumberChange = useStableCallback((value) => {
    setPhoneNumber(value);
  }, []);

  const handleCountryChange = useStableCallback((country) => {
    setSelectedCountry(country);
  }, []);

  const handleDeleteDigit = useStableCallback(() => {
    setPhoneNumber(prev => prev.slice(0, -1));
  }, []);

  const handleToggleSpeaker = useStableCallback(() => {
    setIsSpeakerOn(prev => !prev);
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
      setIsCallInProgress(true);
      
      // 检查麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      // 这里应该集成实际的通话逻辑
      toast.success('Call initiated successfully!');
      
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        setShowMicModal(true);
      } else {
        toast.error('Failed to start call: ' + error.message);
      }
    } finally {
      setIsCallInProgress(false);
    }
  }, [phoneNumber, user, balance]);

  const handleAddContact = useStableCallback((number) => {
    // 这里应该打开添加联系人的模态框
    toast.info('Add contact feature coming soon!');
  }, []);

  const handleTutorialStart = useStableCallback(() => {
    setShowTutorial(false);
    localStorage.setItem('phone-tutorial-seen', 'true');
    toast.info('Tutorial started! Follow the highlights.');
  }, []);

  const handleTutorialSkip = useStableCallback(() => {
    setShowTutorial(false);
    localStorage.setItem('phone-tutorial-seen', 'true');
  }, []);

  const handleMicModalClose = useStableCallback(() => {
    setShowMicModal(false);
  }, []);

  return (
    <PhonePageContainer>
      <PageContent>
        {/* 教程卡片 */}
        {showTutorial && (
          <React.Suspense fallback={<LoadingPlaceholder>Loading tutorial...</LoadingPlaceholder>}>
            <TutorialCard
              title="Welcome to Ubophone!"
              description="Learn how to make your first international call with our easy-to-use dialer."
              onStart={handleTutorialStart}
              onSkip={handleTutorialSkip}
            />
          </React.Suspense>
        )}

        {/* 主拨号器 */}
        <React.Suspense fallback={<LoadingPlaceholder>Loading dialer...</LoadingPlaceholder>}>
          <DialerContainer>
            {/* 余额显示 */}
            <React.Suspense fallback={<LoadingPlaceholder>Loading balance...</LoadingPlaceholder>}>
              <BalanceDisplay 
                balance={balance} 
                isLoading={isBalanceLoading} 
              />
            </React.Suspense>

            {/* 电话号码输入 */}
            <React.Suspense fallback={<LoadingPlaceholder>Loading input...</LoadingPlaceholder>}>
              <PhoneNumberInput
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                selectedCountry={selectedCountry}
                onCountryChange={handleCountryChange}
                onAddContact={handleAddContact}
                isLoggedIn={!!user}
                placeholder="Enter phone number"
              />
            </React.Suspense>

            {/* 拨号键盘 */}
            <React.Suspense fallback={<LoadingPlaceholder>Loading dial pad...</LoadingPlaceholder>}>
              <DialPad
                onNumberPress={handleNumberPress}
                disabled={isCallInProgress}
              />
            </React.Suspense>

            {/* 操作按钮 */}
            <React.Suspense fallback={<LoadingPlaceholder>Loading buttons...</LoadingPlaceholder>}>
              <CallActionButtons
                phoneNumber={phoneNumber}
                onCall={handleStartCall}
                onDelete={handleDeleteDigit}
                onToggleSpeaker={handleToggleSpeaker}
                isSpeakerOn={isSpeakerOn}
                isCallInProgress={isCallInProgress}
                isCallDisabled={!user || balance < 0.01}
              />
            </React.Suspense>
          </DialerContainer>
        </React.Suspense>

        {/* 麦克风权限模态框 */}
        {showMicModal && (
          <React.Suspense fallback={null}>
            <MicrophonePermissionModal onClose={handleMicModalClose} />
          </React.Suspense>
        )}
      </PageContent>
    </PhonePageContainer>
  );
});

OptimizedPhonePage.displayName = 'OptimizedPhonePage';

// 添加性能监控
export default withPerformanceProfiler(OptimizedPhonePage, 'OptimizedPhonePage');
