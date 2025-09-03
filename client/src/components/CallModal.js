import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import twilioService from '../services/twilioService';
import { toast } from 'react-toastify';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const CallContainer = styled.div`
  background: rgba(26, 35, 50, 0.95);
  backdrop-filter: blur(20px);
  border: 3px solid #000;
  border-radius: 0;
  padding: 3rem 2rem;
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const CallStatus = styled.div`
  color: #FFC900;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
`;

const PhoneNumber = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
`;

const CallDuration = styled.div`
  color: #9ca3af;
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
`;

const CallCost = styled.div`
  color: #FFC900;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const CallQuality = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #9ca3af;
  font-size: 0.875rem;
  margin-bottom: 2rem;
`;

const QualityIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 0;
    background: ${props => 
      props.quality >= 4 ? '#FFC900' : 
      props.quality >= 3 ? '#facc15' : '#ef4444'
    };
  }
`;

const CallMode = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.isReal ? 'rgba(255, 201, 0, 0.1)' : 'rgba(168, 85, 247, 0.1)'};
  border: 3px solid ${props => props.isReal ? '#FFC900' : '#a855f7'};
  color: ${props => props.isReal ? '#FFC900' : '#a855f7'};
  padding: 0.25rem 0.75rem;
  border-radius: 0;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ControlButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 0;
  border: 3px solid #000;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  ${props => props.mute && `
    background: ${props.muted ? '#ef4444' : '#FFC900'};
    color: ${props.muted ? '#ffffff' : '#000000'};
    
    &:hover {
      background: ${props.muted ? '#dc2626' : '#ffb700'};
    }
  `}

  ${props => props.volume && `
    background: ${props.volumeOff ? '#ef4444' : '#FFC900'};
    color: ${props.volumeOff ? '#ffffff' : '#000000'};
    
    &:hover {
      background: ${props.volumeOff ? '#dc2626' : '#ffb700'};
    }
  `}

  svg {
    width: 24px;
    height: 24px;
  }
`;

const EndCallButton = styled.button`
  width: 80px;
  height: 80px;
  border-radius: 0;
  background: #ef4444;
  border: 3px solid #000;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #dc2626;
    transform: scale(1.05);
  }

  svg {
    width: 28px;
    height: 28px;
  }
`;

const PulseAnimation = styled.div`
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    border: 3px solid #FFC900;
    border-radius: 0;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1.2);
      opacity: 0;
    }
  }
`;

function CallModal({ isOpen, onClose, phoneNumber, callStatus = 'connecting' }) {
  const [duration, setDuration] = useState(0);
  const [cost, setCost] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volumeOff, setVolumeOff] = useState(false);
  const [status, setStatus] = useState(callStatus);
  const [isRealCall, setIsRealCall] = useState(true); // Always true since demo mode is removed
  const [callQuality] = useState({ mos: 0, jitter: 0, latency: 0 });

  const rate = 0.02; // $0.02 per minute

  // 监听Twilio通话状态变化
  useEffect(() => {
    const handleCallStatusChange = (status, data) => {
      console.log('📞 Call status changed:', status, data);
      
      // Check if this is explicitly marked as a real call
      if (data && data.isRealCall !== undefined) {
        setIsRealCall(data.isRealCall);
        console.log('📞 Call type detected:', data.isRealCall ? 'Real Call' : 'Demo Call');
      } else {
        // Default to true since demo mode is removed
        setIsRealCall(true);
      }
      
      switch (status) {
        case 'connecting':
          setStatus('connecting');
          break;
        case 'ringing':
          setStatus('ringing');
          break;
        case 'accepted':
        case 'open':
          setStatus('connected');
          toast.success(isRealCall ? '✅ Real call connected!' : '🎭 Demo call connected!');
          break;
        case 'disconnected':
        case 'cancelled':
        case 'rejected':
          setStatus('ended');
          if (status === 'rejected') {
            toast.info('Call was declined');
          } else if (status === 'cancelled') {
            toast.info('Call was cancelled');
          }
          break;
        case 'error':
          setStatus('ended');
          toast.error(`❌ Call error: ${data.error}`);
          break;
        default:
          break;
      }
    };

    if (isOpen) {
      twilioService.setCallStatusCallback(handleCallStatusChange);
      
      // 获取当前通话状态
      const callStatus = twilioService.getCallStatus();
      if (callStatus.hasActiveCall) {
        setMuted(callStatus.isMuted);
      }
      
      // All calls are real calls since demo mode is removed
      setIsRealCall(true);
    }

    return () => {
      if (!isOpen) {
        twilioService.setCallStatusCallback(null);
      }
    };
  }, [isOpen, isRealCall]);

  useEffect(() => {
    if (!isOpen) return;

    // Simulate call progression
    const statusTimer = setTimeout(() => {
      if (status === 'connecting') {
        setStatus('connected');
      }
    }, 2000);

    return () => clearTimeout(statusTimer);
  }, [isOpen, status]);

  useEffect(() => {
    if (status !== 'connected') return;

    const timer = setInterval(() => {
      setDuration(prev => {
        const newDuration = prev + 1;
        setCost((newDuration / 60) * rate);
        return newDuration;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, rate]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    // 如果有真实通话，使用Twilio挂断
    const result = twilioService.hangupCall();
    if (result.success) {
      console.log('Call ended successfully');
    }

    setStatus('ended');
    
    setTimeout(() => {
      onClose();
      // Reset state
      setDuration(0);
      setCost(0);
      setMuted(false);
      setVolumeOff(false);
      setStatus('connecting');
    }, 1000);
  };

  const handleToggleMute = () => {
    const result = twilioService.toggleMute();
    if (result.success) {
      setMuted(result.isMuted);
      toast.info(result.isMuted ? 'Microphone muted' : 'Microphone unmuted');
    } else {
      // 如果Twilio操作失败，回退到本地状态
      setMuted(!muted);
    }
  };

  const handleToggleVolume = () => {
    // 注意：Twilio Voice SDK不直接支持扬声器切换
    // 这里只是本地UI状态的切换
    setVolumeOff(!volumeOff);
    toast.info(volumeOff ? 'Speaker on' : 'Speaker off');
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <CallContainer>
        <CallMode isReal={isRealCall}>
          {isRealCall ? '📞 Real Call' : '🎭 Demo Mode'}
        </CallMode>

        <CallStatus>
          {status === 'connecting' && 'Connecting...'}
          {status === 'ringing' && 'Ringing...'}
          {status === 'connected' && 'Connected'}
          {status === 'ended' && 'Call Ended'}
        </CallStatus>

        <PhoneNumber>{phoneNumber}</PhoneNumber>

        {status === 'connected' && (
          <>
            <CallDuration>{formatDuration(duration)}</CallDuration>
            <CallCost>${cost.toFixed(4)}</CallCost>
            
            {isRealCall && (
              <CallQuality>
                <QualityIndicator quality={callQuality.mos}>
                  <div className="indicator"></div>
                  <span>Quality: {callQuality.mos > 0 ? callQuality.mos.toFixed(1) : 'N/A'}</span>
                </QualityIndicator>
                {callQuality.latency > 0 && (
                  <span>| Latency: {Math.round(callQuality.latency)}ms</span>
                )}
              </CallQuality>
            )}
          </>
        )}

        {status === 'ended' && cost > 0 && (
          <CallCost>Total Cost: ${cost.toFixed(4)}</CallCost>
        )}

        <ControlsContainer>
          {status === 'connected' && (
            <>
              <ControlButton 
                mute 
                muted={muted}
                onClick={handleToggleMute}
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <MicOff /> : <Mic />}
              </ControlButton>

              <ControlButton 
                volume 
                volumeOff={volumeOff}
                onClick={handleToggleVolume}
                title={volumeOff ? 'Turn on speaker' : 'Turn off speaker'}
              >
                {volumeOff ? <VolumeX /> : <Volume2 />}
              </ControlButton>
            </>
          )}

          {status === 'connecting' ? (
            <PulseAnimation>
              <EndCallButton onClick={handleEndCall}>
                <PhoneOff />
              </EndCallButton>
            </PulseAnimation>
          ) : (
            <EndCallButton onClick={handleEndCall}>
              <PhoneOff />
            </EndCallButton>
          )}
        </ControlsContainer>
      </CallContainer>
    </ModalOverlay>
  );
}

export default CallModal; 